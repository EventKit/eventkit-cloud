# -*- coding: utf-8 -*-

def get_id(user):
    if hasattr(user, "oauth"):
        return user.oauth.identification
    else:
        return user.username