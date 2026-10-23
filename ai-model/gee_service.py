import ee

def init_gee(project='your-gee-project'):
    ee.Initialize(project=project)

def get_ndvi_ndre(lat, lng, start='2025-01-01', end='2025-12-31'):
    init_gee()
    point = ee.Geometry.Point([lng, lat])
    col = (ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
           .filterBounds(point).filterDate(start, end)
           .sort('CLOUDY_PIXEL_PERCENTAGE'))
    img = col.first()
    ndvi = img.normalizedDifference(['B8', 'B4']).rename('NDVI')
    ndre = img.normalizedDifference(['B8', 'B5']).rename('NDRE')
    vals = img.addBands([ndvi, ndre]).reduceRegion(
        ee.Reducer.mean(), point, 10).getInfo()
    return {'ndvi': vals.get('NDVI'), 'ndre': vals.get('NDRE')}
