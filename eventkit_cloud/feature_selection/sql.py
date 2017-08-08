from pyparsing import Word, delimitedList, Optional, \
    Group, alphas, nums, alphanums, ParseException, Forward, oneOf, quotedString, \
    ZeroOrMore, Keyword 

class InvalidSQL(Exception):
    pass

def checkQuotedColon(s,loc,toks):
    if ':' in toks[0]:
        raise InvalidSQL("identifier with colon : must be in double quotes.")

def checkDoubleQuotes(s,loc,toks):
    #TODO really?
    if toks[0][0] == "'":
        raise InvalidSQL("quoted strings must use double quotes.")

ident          = Word( alphas, alphanums + "_:" ).setParseAction(checkQuotedColon)
columnName =   (ident | quotedString().setParseAction(checkDoubleQuotes))("columnName")

whereExpression = Forward()
and_ = Keyword("and", caseless=True)('and')
or_ = Keyword("or", caseless=True)('or')
in_ = Keyword("in", caseless=True)("in")
isnotnull = Keyword("is not null",caseless=True)('notnull')
binop = oneOf("= != < > >= <=", caseless=True)('binop')
intNum = Word( nums )

columnRval = (intNum | quotedString)('rval*')
whereCondition = Group(
    ( columnName + isnotnull ) |
    ( columnName + binop + columnRval ) |
    ( columnName + in_ + "(" + delimitedList( columnRval ) + ")" ) |
    ( "(" + whereExpression + ")" )
    )('condition')
whereExpression << Group(whereCondition + ZeroOrMore( ( and_ | or_ ) + whereExpression ) )('expression')

class SQLValidator(object):
    def __init__(self,s):
        self._s = s
        self._errors = []
        self._parse_result = None

    @property
    def valid(self):
        try:
            self._parse_result = whereExpression.parseString(self._s,parseAll=True)
        except InvalidSQL as e:
            self._errors.append(e.message)
            return False
        except ParseException as e:
            self._errors.append("SQL could not be parsed.")
            return False
        return True

    @property
    def errors(self):
        return self._errors

    @property
    def column_names(self):
        # takes a dictionary, returns a list
        def column_names_in_dict(d):
            result = []
            for key, value in d.iteritems():
                if 'columnName'  == key:
                    result = result + [value]
                if isinstance(value,dict):
                    result = result + column_names_in_dict(value)
            return result
        return column_names_in_dict(self._parse_result.asDict())

def strip_quotes(token):
    if token[0] == '"' and token[-1] == '"':
        token = token[1:-1]
    if token[0] == "'" and token[-1] == "'":
        token = token[1:-1]
    return token.replace(' ','\\ ')

class OsmfilterRule(object):
    def __init__(self,s):
        self._parse_result = whereExpression.parseString(s,parseAll=True)

    def _rule(self,t):
        if 'or' in t:
            return '( ' + self._rule(t['condition']) + ' or ' + self._rule(t['expression']) + ' )'
        if 'and' in t:
            return '( ' + self._rule(t['condition']) + ' and ' + self._rule(t['expression']) + ' )'
        if 'binop' in t:
            return t['columnName'] + t['binop'] + strip_quotes(t['rval'][0])
        if 'in' in t:
            x = t['columnName'] + ' '.join(['=' + strip_quotes(r) for r in t['rval']])
            return x
        if 'notnull' in t:
            return t['columnName'] + '=*'
        if 'expression' in t: 
            return self._rule(t['expression'])
        if 'condition' in t:
            return self._rule(t['condition'])


    def rule(self):
        return self._rule(self._parse_result.asDict())
