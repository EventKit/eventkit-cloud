import requests
import csv
import getopt
import sys


def get_record(data_id, base_url):
    request_url = base_url.rstrip('/') + '/api/rest/index/record/{}'.format(data_id)
    req = requests.get(request_url)
    if req.status_code == 200:
        try:
            response = req.json()
            return response
        except ValueError:
            return None
    else:
        return None


def read_voyager_cart(cart_file):
    id_list = []
    with open(cart_file, 'r') as csv_file:
        reader = csv.DictReader(csv_file)
        for row in reader:
            id_list.append(row['id'])
    return id_list


def export_voyager_data(file_path, base_url):
    ids = read_voyager_cart(file_path)
    if not ids:
        print("No ID values found in file")
        quit()
    services = []
    for data_id in ids:
        record = get_record(data_id, base_url)
        if record:
            format = record.get('format')
            title = record.get('title')
            if not title:
                title = record.get('name')
            bbox = record.get('bbox')
            endpoint = record.get('path')

            if format == 'application/x-arcgis-feature-server':
                layers = get_feature_server_layers(endpoint)
                if not layers:
                    continue
                for layer in layers:
                    layer_endpoint = validate_endpoint(layer.get('url'))
                    if not endpoint:
                        print("Could not connect to service: {}".format(title))
                    else:
                        services.append({'title': layer.get('title'), 'url': layer_endpoint, 'bbox': bbox, 'format': format})

            elif format == 'application/x-arcgis-feature-server-layer':
                endpoint = validate_endpoint(endpoint)
                if not endpoint:
                    print("Could not connect to service: {}".format(title))
                else:
                    services.append({'title': title, 'url': endpoint, 'bbox': bbox, 'format': format})

            elif format == 'application/vnd.ogc.wms_xml' or format == 'application/vnd.ogc.wms_layer_xml':
                endpoint = validate_endpoint(endpoint)
                endpoint = endpoint.replace('layer.name', 'layers')
                if not endpoint:
                    print("Could not connect to service: {}".format(title))
                else:
                    services.append({'title': title, 'url': endpoint, 'bbox': bbox, 'format': format})

            elif format == 'application/x-arcgis-image-server':
                if record.get('wms_capabilities'):
                    wms_endpoint = record.get('wms_capabilities')[0]
                    wms_endpoint = validate_endpoint(wms_endpoint)
                    if not wms_endpoint:
                        print("Could not connect to service: {}".format(title))
                    else:
                        services.append({'title': title, 'url': wms_endpoint, 'bbox': bbox, 'format': format})
                else:
                    print('Could not find wms endpoint for image service {}'.format(title))

            elif format == 'text/csv':
                endpoint = validate_endpoint(endpoint)
                if not endpoint:
                    print("Could not connect to data endpoint")
                else:
                    services.append({'title': title, 'url': endpoint, 'bbox': bbox, 'format': format})

            else:
                print("Format: '{}' is not yet supported".format(format))
        else:
            print("Could not find record for ID: {}".format(data_id))

    for service in services:
        print service

    return services


def validate_endpoint(service_url):
    try:
        response = requests.get(service_url)
        if response.status_code == 200:
            return service_url
        else:
            raise requests.HTTPError
    except requests.HTTPError:
        try:
            if response.status_code == 200:
                return service_url
            else:
                raise requests.HTTPError
        except requests.HTTPError:
            try:
                if response.status_code == 200:
                    return service_url
                else:
                    raise requests.HTTPError
            except requests.HTTPError:
                print("Could not connect with requested service")
                return None


def get_feature_server_layers(service_url):
    response = requests.get(service_url.rstrip('/') + '/layers?f=json')
    if response.status_code != 200:
        return None
    response = response.json()
    layers = []
    for layer in response.get('layers'):
        layer_id = layer.get('id')
        layer_title = layer.get('name')
        layer_url = service_url.rstrip('/') + '/{}'.format(layer_id)
        layers.append({'title': layer_title, 'url': layer_url})
    return layers


def usage():
    print('--file or -f: (required) The path of the voyager export csv file\n'
          '--baseurl or -u: (required) The base url of target voyager instance')


def main(args):
    try:
        options, remainder = getopt.getopt(
            args, 'f:u:h', ['file=', 'baseurl=', 'help'])
    except getopt.GetoptError as err:
        print (err)
        quit()

    file_path = None
    baseurl = None

    for opt, arg in options:
        if opt in ('-f', '--file'):
            file_path = arg
        elif opt in ('-u', '--baseurl'):
            baseurl = arg
        elif opt in ('-h', '--help'):
            usage()
            quit()

    if baseurl and file_path:
        export_voyager_data(file_path, baseurl)
    else:
        print("Baseurl and file path are required")

if __name__ == "__main__":
    main(sys.argv[1:])