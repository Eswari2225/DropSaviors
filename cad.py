import cv2
import numpy as np
from shapely.geometry import Polygon
import math

# ==== CONFIGURATION ====
image_path = r"C:\Users\eswar\OneDrive\Desktop\sih\2046Integrated\house1.jpg"
required_capacity_liters = 20000
tank_depth_m = 2
scale = 0.05  # meters per pixel (adjust for your plan)

# ==== LOAD IMAGE ====
img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
if img is None:
    raise Exception("Cannot read image. Check file path.")

height, width = img.shape

# ==== DETECT HOUSE FOOTPRINT ====
_, thresh = cv2.threshold(img, 200, 255, cv2.THRESH_BINARY_INV)
contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

if len(contours) == 0:
    raise Exception("No contours found in the image.")

contours = sorted(contours, key=cv2.contourArea, reverse=True)
house_contour = contours[0]
house_polygon = [(pt[0][0], pt[0][1]) for pt in house_contour]

# ==== DEFINE SITE & OPEN SPACE ====
site_boundary = [(0, 0), (width, 0), (width, height), (0, height)]
site_poly = Polygon(site_boundary)
house_poly = Polygon(house_polygon)
open_space = site_poly.difference(house_poly)

# ==== TANK SIZE CALCULATION ====
footprint_area_m2 = required_capacity_liters / (tank_depth_m * 1000)
tank_L = tank_W = math.sqrt(footprint_area_m2)

print(f"\nRequired tank capacity: {required_capacity_liters} liters")
print(f"Recommended tank dimensions (L × W × D): {tank_L:.2f} × {tank_W:.2f} × {tank_depth_m} m\n")

# ==== FUNCTION TO MEASURE DIMENSIONS ====
def measure_space(polygon):
    if polygon.is_empty:
        return 0, 0, 0
    minx, miny, maxx, maxy = polygon.bounds
    width_px = maxx - minx
    height_px = maxy - miny
    area_m2 = polygon.area * (scale ** 2)
    return width_px * scale, height_px * scale, area_m2

# ==== SPLIT DIRECTIONS ====
north_area = Polygon([(0,0),(width,0),(width,height/2),(0,height/2)])
south_area = Polygon([(0,height/2),(width,height/2),(width,height),(0,height)])
west_area  = Polygon([(0,0),(width/2,0),(width/2,height),(0,height)])
east_area  = Polygon([(width/2,0),(width,height/2),(width,height),(width/2,height)])

open_north = open_space.intersection(north_area)
open_south = open_space.intersection(south_area)
open_west  = open_space.intersection(west_area)
open_east  = open_space.intersection(east_area)

# ==== MEASURE EACH DIRECTION ====
directions = {
    "North": measure_space(open_north),
    "South": measure_space(open_south),
    "West": measure_space(open_west),
    "East": measure_space(open_east),
}

# ==== EVALUATE FIT ====
suitable = []
for dir_name, (dim_w, dim_h, area) in directions.items():
    print(f"{dir_name} side → Width: {dim_w:.2f} m, Height: {dim_h:.2f} m, Area: {area:.2f} m²")
    if dim_w >= tank_L and dim_h >= tank_W:
        suitable.append(dir_name)

# ==== PRINT SUITABLE SIDE ====
if suitable:
    print("\n✅ Tank can be placed in:", ", ".join(suitable))
else:
    print("\n❌ No direction has enough space for the tank.")

# ==== VISUALIZE ====
img_color = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)

# Draw house footprint in red
pts = np.array(house_polygon, np.int32).reshape((-1,1,2))
cv2.polylines(img_color, [pts], True, (0,0,255), 2)

# Overlay direction labels
cv2.putText(img_color, "NORTH", (int(width/3), 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (255,0,0), 2)
cv2.putText(img_color, "SOUTH", (int(width/3), height-20), cv2.FONT_HERSHEY_SIMPLEX, 1, (0,255,0), 2)
cv2.putText(img_color, "WEST", (20, int(height/2)), cv2.FONT_HERSHEY_SIMPLEX, 1, (0,0,255), 2)
cv2.putText(img_color, "EAST", (width-120, int(height/2)), cv2.FONT_HERSHEY_SIMPLEX, 1, (0,255,255), 2)

cv2.imshow("House Plan with Directions", img_color)
cv2.waitKey(0)
cv2.destroyAllWindows()
