# -*- coding: utf-8 -*-

class Purpose():
    def __init__(self, spaces):
        self.space = space

    def add(self):
        pass

    def group(self):
        tmp = []
        for purpose in self.space:
            for direction in purpose:
                for value in direction:
                    if tmp.index(value) < 0:
                        tmp.push(value)
                    else:
                        del value

