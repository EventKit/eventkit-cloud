import pickle
import codecs


def dump_exception_info(einfo):
    return codecs.encode(pickle.dumps(einfo), "base64").decode()


def load_exception_info(einfo):
    return pickle.loads(codecs.decode(einfo.encode(), "base64"))