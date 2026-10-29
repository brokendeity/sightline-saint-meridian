"""Read-only static-scene snapshots independent of Blender evaluation caches.

Opening/closing a hidden export collection changes matrix_local/matrix_world
caches without changing saved TRS. Compare the actual source basis, parenting
and inverse-parent transform, and derive world matrices from those saved values.
This module never edits the scene or replaces older checkpoint verifiers.
"""
import array
import ast
import hashlib
import json
from pathlib import Path

import bpy


def source_props():
    return {o.name:{
        'parent':o.parent.name if o.parent else None,
        'basis':[list(row) for row in o.matrix_basis],
        'parentInverse':[list(row) for row in o.matrix_parent_inverse],
        'location':list(o.location),'rotationMode':o.rotation_mode,
        'euler':list(o.rotation_euler),'quaternion':list(o.rotation_quaternion),
        'axisAngle':list(o.rotation_axis_angle),'scale':list(o.scale),
        'deltaLocation':list(o.delta_location),'deltaEuler':list(o.delta_rotation_euler),
        'deltaQuaternion':list(o.delta_rotation_quaternion),'deltaScale':list(o.delta_scale),
        'hideRender':o.hide_render,'hideViewport':o.hide_viewport
    } for o in bpy.data.objects}


def signatures():
    memo={}

    def source_world(obj):
        assert not obj.constraints, 'Constrained objects require an evaluated-source policy: '+obj.name
        if obj.name not in memo:
            memo[obj.name]=(source_world(obj.parent)@obj.matrix_parent_inverse@obj.matrix_basis
                            if obj.parent else obj.matrix_basis.copy())
        return memo[obj.name]

    # Retain the existing mesh/material/property snapshot algorithm verbatim;
    # substitute only the transient world-cache read with the source transform.
    file=Path(__file__).with_name('v02_scene_signatures.py')
    tree=ast.parse(file.read_text())
    function=next(n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name=='signatures')

    class SavedWorld(ast.NodeTransformer):
        def visit_Attribute(self,node):
            if isinstance(node.value,ast.Name) and node.value.id=='o' and node.attr=='matrix_world':
                return ast.copy_location(ast.Call(func=ast.Name(id='source_world',ctx=ast.Load()),
                    args=[ast.Name(id='o',ctx=ast.Load())],keywords=[]),node)
            return self.generic_visit(node)

    function=SavedWorld().visit(function)
    module=ast.fix_missing_locations(ast.Module(body=[function],type_ignores=[]))
    scope={'bpy':bpy,'json':json,'hashlib':hashlib,'array':array,'source_world':source_world}
    exec(compile(module,str(file),'exec'),scope)
    return scope['signatures']()
