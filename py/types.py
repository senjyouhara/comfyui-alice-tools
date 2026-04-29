class AnyType(str):
    def __ne__(self, __value):
        return False


any_type = AnyType("*")


class FlexibleOptionalInputType(dict):
    def __init__(self, type_name, data=None):
        self.type_name = type_name
        self.data = data or {}
        super().__init__(self.data)

    def __getitem__(self, key):
        if key in self.data:
            return self.data[key]
        return (self.type_name,)

    def __contains__(self, key):
        return True
