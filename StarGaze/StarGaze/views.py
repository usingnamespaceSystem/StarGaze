# -*- coding: utf-8 -*-
from django.http import HttpResponse
from django.template.loader import get_template
from django.views.decorators.csrf import csrf_protect
from django.conf import settings

import os
import json

def home(request):
    template = get_template(os.path.join(settings.STATIC_ROOT, 'static/templates/desc_table.html'))
    return HttpResponse(template.render({}, request))

@csrf_protect
def directions(request):
    json_tree = json.loads(request.read())

    dir_group = []

    for space in json_tree:
        for item in space['items']:
            for direction in item['direction']:
                dir_group.append({
                    'name': direction,
                    'group': ''
                })

    response = json.dumps(dir_group)

    return HttpResponse(response)