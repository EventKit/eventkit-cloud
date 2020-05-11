from typing import Union, List


def validate_object(filter: Union[List[any], bool], object_dict: dict) -> bool:
    """This function takes a filter and a dict and validates it. The filter should be a three part List left part,
    operator (as a string), and right part which is the key for the desired value in object dict.  All values,
    are strings and the operator will be evaluated for safety.  While normally we can make
    say equalities are symmetric, for this function we treat the right part as a mapping to the dict and since we
    are allowing in to be an operation then we can't reverse them (i.e. value in [] does not equal [] in value).
    For example, to validate "if a 'MyGroup' is in 'groups' or the 'employmentStatus' is a 'student'
    then the following filter could be applied.
    [["MyGroup", "in", "groups"], "or", ["student", "==", "employmentStatus"]]
    """
    if isinstance(filter, bool):
        return bool
    else:
        left, operator, right = filter

    if isinstance(left, list):
        left = validate_object(left, object_dict)

    if isinstance(right, list):
        right = validate_object(right, object_dict)
    elif isinstance(right, str):
        right = object_dict.get(right)

    if isinstance(left, str):
        if left.lower() == "none":
            left = None

    # https://docs.python.org/3/reference/expressions.html#comparisons
    operations = {
        "in": lambda: left in right,
        "not in": lambda: left not in right,
        "<": lambda: left < right,
        "<=": lambda: left <= right,
        ">": lambda: left > right,
        ">=": lambda: left >= right,
        "==": lambda: left == right,
        "!=": lambda: left != right,
        "is": lambda: left is right,
        "is not": lambda: left is not right,
        "or": lambda: left or right,
        "and": lambda: left and right,
    }

    try:
        operation = operations[operator]
        return operation()
    except TypeError:
        # If a field isn't defined then we will end up trying something against None,
        # which probably isn't allowed. Consider it a "fail" and continue with evaluation.
        return False
