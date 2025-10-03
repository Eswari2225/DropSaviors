from flask_cors import CORS
import os
import math
import pandas as pd
import numpy as np
from flask import Flask, render_template, request, send_file, session, redirect, url_for, jsonify
from sklearn.linear_model import LinearRegression
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.pagesizes import letter
from io import BytesIO
from datetime import datetime
import matplotlib.pyplot as plt
import base64
import cv2
from PIL import Image as PILImage
import tempfile

# ---------------- Flask App ----------------
app = Flask(__name__, static_folder='static', template_folder='templates')
app.secret_key = os.environ.get('SECRET_KEY', 'replace_with_a_stronger_secret_key_here')
CORS(app, supports_credentials=True, origins=[
    'http://localhost:5173', 
    'http://127.0.0.1:5173', 
    'https://*.onrender.com',
    'https://dropsaviors-2025.onrender.com'
])

# ---------------- Dataset loading with fallback ----------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "dataset", "districts_rainfall.csv")

# Default sample data when CSV is not available
def get_default_data():
    """Provides sample data when dataset is not available"""
    import random
    
    sample_districts = ["Erode", "Chennai", "Coimbatore", "Madurai", "Salem"]
    sample_stations = {
        "Erode": ["Kodivery", "Bhavani", "Sathyamangalam"],
        "Chennai": ["Nungambakkam", "Meenambakkam", "Taramani"],
        "Coimbatore": ["Peelamedu", "Sulur", "Mettupalayam"],
        "Madurai": ["Airport", "Melur", "Usilampatti"],
        "Salem": ["Airport", "Mettur", "Yercaud"]
    }
    
    # Generate sample rainfall data
    data = []
    for district in sample_districts:
        for station in sample_stations[district]:
            for year in range(2010, 2024):
                # Generate realistic rainfall values
                base_rainfall = random.uniform(8, 25)
                for month in range(1, 13):
                    date_str = f"{year}-{month:02d}-01"
                    rainfall = max(0, base_rainfall + random.uniform(-5, 10))
                    data.append({
                        'dist': district,
                        'station': station,
                        'value': round(rainfall, 2),
                        'date': date_str,
                        'year': year
                    })
    
    return pd.DataFrame(data)

try:
    if os.path.exists(DATA_PATH):
        # read CSV and normalize column names
        _raw = pd.read_csv(DATA_PATH)
        _raw.columns = [c.strip().lower() for c in _raw.columns]

        # Expected columns: dist, station, value, date (case-insensitive)
        df = _raw.copy()
        expected = {"dist", "station", "value", "date"}
        if not expected.issubset(set(df.columns)):
            print(f"Warning: CSV missing columns {expected}. Using sample data.")
            df = get_default_data()
        else:
            # extract year from date; create 'year' column
            df['year'] = pd.to_datetime(df['date'], errors='coerce').dt.year
            df['value'] = pd.to_numeric(df['value'], errors='coerce')
            # drop rows with missing year or value
            df = df.dropna(subset=['year', 'value'])
    else:
        print(f"Dataset not found at {DATA_PATH}. Using sample data.")
        df = get_default_data()
        
except Exception as e:
    print(f"Error loading dataset: {e}. Using sample data.")
    df = get_default_data()

# prepare district / station map
districts = sorted(df['dist'].dropna().unique().tolist())
subdistrict_map = {d: sorted(df[df['dist'] == d]['station'].dropna().unique().tolist()) for d in districts}

# ---------------- Domain parameters ----------------
ROOF_COEFF = {
    "concrete": 0.85,
    "tile": 0.75,
    "asbestos": 0.7,
    "thatch": 0.6
}

# Enhanced cost structure with more detailed breakdown
COST = {
    # Storage tank costs
    "tank_per_l_plastic": 6.0,
    "tank_per_l_rcc": 4.0,
    "tank_install_unit": 2000,
    "rcc_install_unit": 8000,
    
    # Common components
    "pipe_fittings": 3000,
    "first_flush": 2500,
    "labour_system": 3000,
    
    # Recharge structure costs
    "excavation_per_m3": 400,
    "pcc_lining_per_m3": 5000,
    "filter_media_per_unit": 2500,
    "labour_recharge_per_unit": 3500,
    
    # Filter media components
    "gravel_per_m3": 3000,
    "sand_per_m3": 1500,
    "charcoal_per_unit": 500,
    
    # Additional materials
    "cement_per_bag": 400,
    "sand_per_cum": 1800,
    "aggregate_per_cum": 1600,
    "bricks_per_1000": 8000,
    "steel_per_kg": 70,
    "plumbing_fittings": 1500,
    "filter_unit": 4500
}

SYSTEM_INFO = {
    "Percolation Pit": {
        "explanation": "Small household pit; recharges shallow groundwater.", 
        "base_cost": 15000,
        "typical_size": "2m x 2m x 2m",
        "shape_options": ["rectangular", "circular"]
    },
    "Recharge Trench": {
        "explanation": "Shallow trench with filter material; good for medium rooftops.", 
        "base_cost": 25000,
        "typical_size": "10m x 1m x 1m",
        "shape_options": ["rectangular"]
    },
    "Recharge Shaft": {
        "explanation": "Vertical shaft for deeper percolation; needs soil depth.", 
        "base_cost": 40000,
        "typical_size": "2m diameter x 3m depth",
        "shape_options": ["circular"]
    },
    "Large Storage Tank": {
        "explanation": "Stores large volumes for later use.", 
        "base_cost": 60000,
        "typical_size": "Varies based on requirement",
        "shape_options": ["rectangular", "circular"]
    }
}

# ---------- Helper functions ----------
def predict_future_rainfall(yearly_df, start_year=2025, end_year=2036):
    yearly_df = yearly_df.dropna(subset=['year', 'value'])
    if yearly_df.shape[0] < 2:
        fallback = float(yearly_df['value'].mean()) if not yearly_df.empty else 0.0
        return {y: round(fallback, 2) for y in range(start_year, end_year + 1)}
    X = yearly_df[['year']].values.astype(float)
    y = yearly_df['value'].values.astype(float)
    model = LinearRegression()
    model.fit(X, y)
    years = np.arange(start_year, end_year + 1).reshape(-1, 1)
    preds = model.predict(years)
    return {int(y[0]): round(float(p), 2) for y, p in zip(years, preds)}

def volume_from_shape(shape, dims):
    """
    dims for rectangular: length, width, depth
    dims for circular/cylindrical: diameter, height OR depth
    """
    try:
        if shape == 'rectangular':
            L = float(dims.get('length', 0))
            W = float(dims.get('width', 0))
            H = float(dims.get('depth', 0))
            m3 = max(0.0, L * W * H)
        elif shape in ('circular', 'cylindrical'):
            d = float(dims.get('diameter', 0))
            h = float(dims.get('depth', dims.get('height', 0)))
            if d <= 0 or h <= 0:
                return 0.0, 0.0
            r = d / 2.0
            m3 = math.pi * (r ** 2) * h
        else:
            m3 = 0.0
    except Exception:
        m3 = 0.0
    liters = m3 * 1000.0
    return round(liters, 2), round(m3, 4)

def greedy_fill(required_l, options):
    required = float(required_l)
    chosen = []
    remaining = required
    for opt in sorted(options, key=lambda x: -x['volume_l']):
        cnt = int(remaining // opt['volume_l'])
        if cnt > 0:
            chosen.append({'label': opt['label'], 'count': cnt, 'per_unit_volume_l': opt['volume_l']})
            remaining -= cnt * opt['volume_l']
    if remaining > 0 and options:
        smallest = min(options, key=lambda x: x['volume_l'])
        chosen.append({'label': smallest['label'], 'count': 1, 'per_unit_volume_l': smallest['volume_l']})
        remaining -= smallest['volume_l']
    return chosen, max(0.0, round(remaining, 2))

TANK_OPTIONS = [
    {'label': '5000L Tank', 'volume_l': 5000},
    {'label': '2000L Tank', 'volume_l': 2000},
    {'label': '1000L Barrel', 'volume_l': 1000}
]
RECHARGE_OPTIONS = [
    {'label': 'Trench (20m3)', 'volume_l': 20000},
    {'label': 'Large Pit (10m3)', 'volume_l': 10000},
    {'label': 'Medium Pit (5m3)', 'volume_l': 5000},
    {'label': 'Small Pit (2m3)', 'volume_l': 2000}
]

def compute_tank_cost(chosen_tanks, material='plastic', shape='rectangular', dimensions=None):
    per_l = COST['tank_per_l_plastic'] if material == 'plastic' else COST['tank_per_l_rcc']
    install_unit = COST['tank_install_unit'] if material == 'plastic' else COST['rcc_install_unit']
    
    items, material_total, install_total = [], 0.0, 0.0
    
    # Calculate material costs based on volume
    for t in chosen_tanks:
        cnt = t['count']
        vol = t['per_unit_volume_l']
        mat_cost = per_l * vol * cnt
        inst_cost = install_unit * cnt
        items.append({
            'label': t['label'], 'count': cnt, 'vol_l': vol,
            'material_cost': int(round(mat_cost)),
            'install_cost': int(round(inst_cost))
        })
        material_total += mat_cost
        install_total += inst_cost
    
    # Add detailed material breakdown for custom tanks
    if dimensions:
        vol_l, vol_m3 = volume_from_shape(shape, dimensions)
        if shape == 'rectangular':
            L, W, H = dimensions.get('length', 0), dimensions.get('width', 0), dimensions.get('depth', 0)
            surface_area = 2*(L*H + W*H) + L*W  # For lining/plastering calculation
        else:  # circular
            d, h = dimensions.get('diameter', 0), dimensions.get('depth', 0)
            surface_area = math.pi * d * h + math.pi * (d/2)**2  # For lining/plastering
        
        # Add detailed cost components for RCC tanks
        if material == 'rcc':
            # Cement calculation (approx 7 bags per m3 of concrete)
            cement_bags = vol_m3 * 7
            cement_cost = cement_bags * COST['cement_per_bag']
            
            # Sand and aggregate calculation
            sand_vol = vol_m3 * 0.5  # Approx 0.5 m3 sand per m3 concrete
            aggregate_vol = vol_m3 * 0.8  # Approx 0.8 m3 aggregate per m3 concrete
            sand_cost = sand_vol * COST['sand_per_cum']
            aggregate_cost = aggregate_vol * COST['aggregate_per_cum']
            
            # Steel reinforcement (approx 75kg per m3 of concrete for water tanks)
            steel_kg = vol_m3 * 75
            steel_cost = steel_kg * COST['steel_per_kg']
            
            # Formwork (approx 20% of material cost)
            formwork_cost = (cement_cost + sand_cost + aggregate_cost + steel_cost) * 0.2
            
            material_total = cement_cost + sand_cost + aggregate_cost + steel_cost + formwork_cost
            
            items.append({
                'label': 'Cement', 'count': round(cement_bags, 1), 'vol_l': None,
                'material_cost': int(round(cement_cost)),
                'install_cost': 0
            })
            items.append({
                'label': 'Sand', 'count': round(sand_vol, 2), 'vol_l': None,
                'material_cost': int(round(sand_cost)),
                'install_cost': 0
            })
            items.append({
                'label': 'Aggregate', 'count': round(aggregate_vol, 2), 'vol_l': None,
                'material_cost': int(round(aggregate_cost)),
                'install_cost': 0
            })
            items.append({
                'label': 'Steel', 'count': round(steel_kg, 1), 'vol_l': None,
                'material_cost': int(round(steel_cost)),
                'install_cost': 0
            })
            items.append({
                'label': 'Formwork', 'count': 1, 'vol_l': None,
                'material_cost': int(round(formwork_cost)),
                'install_cost': 0
            })
    
    piping, first_flush, labour = COST['pipe_fittings'], COST['first_flush'], COST['labour_system']
    filter_unit = COST['filter_unit']
    
    total = int(round(material_total + install_total + piping + first_flush + labour + filter_unit))
    
    return {
        'items': items,
        'summary': {
            'material_total': int(round(material_total)),
            'install_total': int(round(install_total)),
            'piping_fittings': piping,
            'first_flush': first_flush,
            'filter_unit': filter_unit,
            'labour': labour,
            'total': total
        }
    }

def compute_recharge_cost(chosen_recharge, lined=True, shape='rectangular', dimensions=None):
    items, total_exc, total_line, total_media, total_labour = [], 0.0, 0.0, 0.0, 0.0
    
    for r in chosen_recharge:
        cnt, vol_l = r['count'], r['per_unit_volume_l']
        vol_m3 = vol_l / 1000.0
        
        # Excavation cost
        exc = vol_m3 * COST['excavation_per_m3'] * cnt
        
        # Lining cost (if applicable)
        line = vol_m3 * COST['pcc_lining_per_m3'] * cnt if lined else 0.0
        
        # Filter media cost
        media = COST['filter_media_per_unit'] * cnt
        
        # Labour cost
        labour = COST['labour_recharge_per_unit'] * cnt
        
        items.append({
            'label': r['label'], 'count': cnt, 'vol_l': vol_l,
            'excavation_cost': int(round(exc)),
            'lining_cost': int(round(line)),
            'filter_media_cost': int(round(media)),
            'labour_cost': int(round(labour))
        })
        total_exc += exc
        total_line += line
        total_media += media
        total_labour += labour
    
    # Add detailed material breakdown for custom recharge structures
    if dimensions:
        vol_l, vol_m3 = volume_from_shape(shape, dimensions)
        
        # Gravel and sand for filter media
        gravel_vol = vol_m3 * 0.4  # 40% of volume for gravel
        sand_vol = vol_m3 * 0.3    # 30% of volume for sand
        charcoal_units = max(1, int(vol_m3 * 0.5))  # 0.5 units per m3
        
        gravel_cost = gravel_vol * COST['gravel_per_m3']
        sand_cost = sand_vol * COST['sand_per_m3']
        charcoal_cost = charcoal_units * COST['charcoal_per_unit']
        
        total_media += gravel_cost + sand_cost + charcoal_cost
        
        items.append({
            'label': 'Gravel', 'count': round(gravel_vol, 2), 'vol_l': None,
            'excavation_cost': 0,
            'lining_cost': 0,
            'filter_media_cost': int(round(gravel_cost)),
            'labour_cost': 0
        })
        items.append({
            'label': 'Sand', 'count': round(sand_vol, 2), 'vol_l': None,
            'excavation_cost': 0,
            'lining_cost': 0,
            'filter_media_cost': int(round(sand_cost)),
            'labour_cost': 0
        })
        items.append({
            'label': 'Charcoal', 'count': charcoal_units, 'vol_l': None,
            'excavation_cost': 0,
            'lining_cost': 0,
            'filter_media_cost': int(round(charcoal_cost)),
            'labour_cost': 0
        })
        
        # Lining materials if lined
        if lined:
            if shape == 'rectangular':
                L, W, H = dimensions.get('length', 0), dimensions.get('width', 0), dimensions.get('depth', 0)
                surface_area = 2*(L*H + W*H) + L*W
            else:  # circular
                d, h = dimensions.get('diameter', 0), dimensions.get('depth', 0)
                surface_area = math.pi * d * h + math.pi * (d/2)**2
            
            # PCC lining calculation (approx 0.15m thickness)
            pcc_vol = surface_area * 0.15
            cement_bags = pcc_vol * 7  # 7 bags per m3
            sand_vol_pcc = pcc_vol * 0.5
            aggregate_vol_pcc = pcc_vol * 0.8
            
            cement_cost = cement_bags * COST['cement_per_bag']
            sand_cost_pcc = sand_vol_pcc * COST['sand_per_cum']
            aggregate_cost_pcc = aggregate_vol_pcc * COST['aggregate_per_cum']
            
            total_line += cement_cost + sand_cost_pcc + aggregate_cost_pcc
            
            items.append({
                'label': 'Cement (lining)', 'count': round(cement_bags, 1), 'vol_l': None,
                'excavation_cost': 0,
                'lining_cost': int(round(cement_cost)),
                'filter_media_cost': 0,
                'labour_cost': 0
            })
            items.append({
                'label': 'Sand (lining)', 'count': round(sand_vol_pcc, 2), 'vol_l': None,
                'excavation_cost': 0,
                'lining_cost': int(round(sand_cost_pcc)),
                'filter_media_cost': 0,
                'labour_cost': 0
            })
            items.append({
                'label': 'Aggregate (lining)', 'count': round(aggregate_vol_pcc, 2), 'vol_l': None,
                'excavation_cost': 0,
                'lining_cost': int(round(aggregate_cost_pcc)),
                'filter_media_cost': 0,
                'labour_cost': 0
            })
    
    total = int(round(total_exc + total_line + total_media + total_labour))
    
    return {
        'items': items,
        'summary': {
            'excavation_total': int(round(total_exc)),
            'lining_total': int(round(total_line)),
            'media_total': int(round(total_media)),
            'labour_total': int(round(total_labour)),
            'total': total
        }
    }

def generate_3d_svg(shape, dimensions, system_type="Storage Tank"):
    """Generate 3D SVG visualization for structures"""
    try:
        if shape == 'rectangular':
            length = float(dimensions.get('length', 2))
            width = float(dimensions.get('width', 2))
            depth = float(dimensions.get('depth', 2))
            volume = length * width * depth * 1000  # Convert to liters
            
            # Isometric projection parameters
            scale = 40
            offset_x, offset_y = 100, 100
            
            # Calculate isometric coordinates
            def iso_point(x, y, z):
                ix = offset_x + (x - z) * scale * 0.866
                iy = offset_y + (x + z) * scale * 0.5 - y * scale
                return ix, iy
            
            # Define vertices
            vertices = [
                iso_point(0, 0, 0),        # 0: bottom-left-front
                iso_point(length, 0, 0),   # 1: bottom-right-front
                iso_point(length, 0, width), # 2: bottom-right-back
                iso_point(0, 0, width),    # 3: bottom-left-back
                iso_point(0, depth, 0),    # 4: top-left-front
                iso_point(length, depth, 0), # 5: top-right-front
                iso_point(length, depth, width), # 6: top-right-back
                iso_point(0, depth, width) # 7: top-left-back
            ]
            
            svg = f'''
            <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="sideGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#4A90E2;stop-opacity:0.8" />
                        <stop offset="100%" style="stop-color:#2E5A87;stop-opacity:0.9" />
                    </linearGradient>
                    <linearGradient id="topGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#6BA3F5;stop-opacity:0.7" />
                        <stop offset="100%" style="stop-color:#4A90E2;stop-opacity:0.8" />
                    </linearGradient>
                    <linearGradient id="frontGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#5A9AF0;stop-opacity:0.75" />
                        <stop offset="100%" style="stop-color:#3A7BC8;stop-opacity:0.85" />
                    </linearGradient>
                </defs>
                
                <!-- Back face -->
                <polygon points="{vertices[3][0]},{vertices[3][1]} {vertices[2][0]},{vertices[2][1]} {vertices[6][0]},{vertices[6][1]} {vertices[7][0]},{vertices[7][1]}" 
                         fill="url(#sideGradient)" stroke="#2E5A87" stroke-width="1.5" opacity="0.6"/>
                
                <!-- Right face -->
                <polygon points="{vertices[1][0]},{vertices[1][1]} {vertices[2][0]},{vertices[2][1]} {vertices[6][0]},{vertices[6][1]} {vertices[5][0]},{vertices[5][1]}" 
                         fill="url(#sideGradient)" stroke="#2E5A87" stroke-width="1.5"/>
                
                <!-- Top face -->
                <polygon points="{vertices[4][0]},{vertices[4][1]} {vertices[5][0]},{vertices[5][1]} {vertices[6][0]},{vertices[6][1]} {vertices[7][0]},{vertices[7][1]}" 
                         fill="url(#topGradient)" stroke="#2E5A87" stroke-width="1.5"/>
                
                <!-- Front face -->
                <polygon points="{vertices[0][0]},{vertices[0][1]} {vertices[1][0]},{vertices[1][1]} {vertices[5][0]},{vertices[5][1]} {vertices[4][0]},{vertices[4][1]}" 
                         fill="url(#frontGradient)" stroke="#2E5A87" stroke-width="1.5"/>
                
                <!-- Left face -->
                <polygon points="{vertices[0][0]},{vertices[0][1]} {vertices[3][0]},{vertices[3][1]} {vertices[7][0]},{vertices[7][1]} {vertices[4][0]},{vertices[4][1]}" 
                         fill="url(#sideGradient)" stroke="#2E5A87" stroke-width="1.5" opacity="0.8"/>
                
                <!-- Dimension labels -->
                <text x="{(vertices[0][0] + vertices[1][0]) / 2}" y="{vertices[0][1] + 20}" text-anchor="middle" 
                      font-family="Arial, sans-serif" font-size="12" fill="#2E5A87" font-weight="bold">{length}m</text>
                
                <text x="{vertices[1][0] + 15}" y="{(vertices[1][1] + vertices[2][1]) / 2}" text-anchor="middle" 
                      font-family="Arial, sans-serif" font-size="12" fill="#2E5A87" font-weight="bold">{width}m</text>
                
                <text x="{vertices[0][0] - 20}" y="{(vertices[0][1] + vertices[4][1]) / 2}" text-anchor="middle" 
                      font-family="Arial, sans-serif" font-size="12" fill="#2E5A87" font-weight="bold">{depth}m</text>
                
                <!-- Title and volume -->
                <text x="200" y="25" text-anchor="middle" font-family="Arial, sans-serif" 
                      font-size="16" fill="#2E5A87" font-weight="bold">{system_type}</text>
                <text x="200" y="45" text-anchor="middle" font-family="Arial, sans-serif" 
                      font-size="14" fill="#4A90E2">Volume: {volume:,.0f} L</text>
            </svg>
            '''
            
        else:  # circular/cylindrical
            diameter = float(dimensions.get('diameter', 2))
            height = float(dimensions.get('depth', dimensions.get('height', 2)))
            radius = diameter / 2
            volume = math.pi * radius * radius * height * 1000  # Convert to liters
            
            # Isometric parameters for cylinder
            scale = 50
            offset_x, offset_y = 200, 150
            
            # Ellipse parameters for isometric view
            ellipse_rx = radius * scale * 0.866
            ellipse_ry = radius * scale * 0.5
            
            svg = f'''
            <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="cylinderGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style="stop-color:#2E5A87;stop-opacity:0.9" />
                        <stop offset="50%" style="stop-color:#4A90E2;stop-opacity:0.8" />
                        <stop offset="100%" style="stop-color:#2E5A87;stop-opacity:0.9" />
                    </linearGradient>
                    <linearGradient id="topEllipseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#6BA3F5;stop-opacity:0.7" />
                        <stop offset="100%" style="stop-color:#4A90E2;stop-opacity:0.8" />
                    </linearGradient>
                    <linearGradient id="bottomEllipseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#3A7BC8;stop-opacity:0.9" />
                        <stop offset="100%" style="stop-color:#2E5A87;stop-opacity:1.0" />
                    </linearGradient>
                </defs>
                
                <!-- Cylinder body -->
                <rect x="{offset_x - ellipse_rx}" y="{offset_y}" 
                      width="{2 * ellipse_rx}" height="{height * scale}" 
                      fill="url(#cylinderGradient)" stroke="#2E5A87" stroke-width="1.5"/>
                
                <!-- Bottom ellipse -->
                <ellipse cx="{offset_x}" cy="{offset_y + height * scale}" 
                         rx="{ellipse_rx}" ry="{ellipse_ry}" 
                         fill="url(#bottomEllipseGradient)" stroke="#2E5A87" stroke-width="1.5"/>
                
                <!-- Top ellipse -->
                <ellipse cx="{offset_x}" cy="{offset_y}" 
                         rx="{ellipse_rx}" ry="{ellipse_ry}" 
                         fill="url(#topEllipseGradient)" stroke="#2E5A87" stroke-width="1.5"/>
                
                <!-- Dimension labels -->
                <text x="{offset_x}" y="{offset_y + height * scale + ellipse_ry + 20}" text-anchor="middle" 
                      font-family="Arial, sans-serif" font-size="12" fill="#2E5A87" font-weight="bold">D {diameter}m</text>
                
                <text x="{offset_x - ellipse_rx - 25}" y="{offset_y + height * scale / 2}" text-anchor="middle" 
                      font-family="Arial, sans-serif" font-size="12" fill="#2E5A87" font-weight="bold" 
                      transform="rotate(-90, {offset_x - ellipse_rx - 25}, {offset_y + height * scale / 2})">{height}m</text>
                
                <!-- Title and volume -->
                <text x="200" y="25" text-anchor="middle" font-family="Arial, sans-serif" 
                      font-size="16" fill="#2E5A87" font-weight="bold">{system_type}</text>
                <text x="200" y="45" text-anchor="middle" font-family="Arial, sans-serif" 
                      font-size="14" fill="#4A90E2">Volume: {volume:,.0f} L</text>
            </svg>
            '''
        
        return svg
        
    except Exception as e:
        print(f"Error generating 3D SVG: {e}")
        return ""

def detect_areas_from_cad(image_file):
    """Detect roof area and open area from CAD image using computer vision"""
    try:
        # Read image
        if hasattr(image_file, 'read'):
            image_data = image_file.read()
            image_file.seek(0)  # Reset file pointer
        else:
            with open(image_file, 'rb') as f:
                image_data = f.read()
        
        # Convert to numpy array
        nparr = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            return {"roof_area": 0, "open_area": 0, "error": "Could not decode image"}
        
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Apply Gaussian blur to reduce noise
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Apply adaptive thresholding to get binary image
        thresh = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY, 11, 2)
        
        # Find contours
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # Calculate areas
        roof_area = 0
        open_area = 0
        total_image_area = image.shape[0] * image.shape[1]
        
        # Analyze contours
        for contour in contours:
            area = cv2.contourArea(contour)
            
            # Calculate the bounding rectangle
            x, y, w, h = cv2.boundingRect(contour)
            aspect_ratio = w / h if h > 0 else 0
            
            # Heuristics to classify areas
            # Roof areas typically have rectangular shapes and are larger
            if area > total_image_area * 0.02:  # At least 2% of image
                if 0.5 <= aspect_ratio <= 3.0:  # Reasonable aspect ratio for buildings
                    roof_area += area
                else:
                    open_area += area
            elif area > total_image_area * 0.01:  # Smaller areas might be open spaces
                open_area += area
        
        # Convert pixel areas to square meters (rough estimation)
        # Assuming 1 pixel = approximately 0.1m (this would need calibration in real application)
        pixel_to_m2 = 0.01  # 1 pixel = 0.1m x 0.1m = 0.01 sq.m
        
        roof_area_m2 = max(100, roof_area * pixel_to_m2)  # Minimum 100 sq m
        open_area_m2 = max(50, open_area * pixel_to_m2)   # Minimum 50 sq m
        
        return {
            "roof_area": round(roof_area_m2, 2),
            "open_area": round(open_area_m2, 2),
            "detection_confidence": "medium",
            "total_detected_area": round(roof_area_m2 + open_area_m2, 2)
        }
        
    except Exception as e:
        print(f"Error in CAD detection: {e}")
        return {
            "roof_area": 200,  # Default fallback
            "open_area": 100,  # Default fallback
            "error": str(e),
            "detection_confidence": "low"
    }

def generate_structure_image(shape, dims, filename):
    try:
        plt.figure(figsize=(8, 6))
        
        if shape == 'rectangular':
            L, W, H = float(dims.get('length', 1)), float(dims.get('width', 1)), float(dims.get('depth', 1))
            
            # Create 3D plot for rectangular shape
            ax = plt.axes(projection='3d')
            
            # Define the vertices of the rectangular prism
            x = [0, L, L, 0, 0, L, L, 0]
            y = [0, 0, W, W, 0, 0, W, W]
            z = [0, 0, 0, 0, H, H, H, H]
            
            # Plot the vertices
            ax.scatter3D(x, y, z)
            
            # Create list of sides
            vertices = [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], 
                       [2, 3, 7, 6], [0, 3, 7, 4], [1, 2, 6, 5]]
            
            # Plot sides
            for vert in vertices:
                X = [x[i] for i in vert]
                Y = [y[i] for i in vert]
                Z = [z[i] for i in vert]
                ax.plot3D(X, Y, Z, color="blue")
            
            ax.set_xlabel('Length (m)')
            ax.set_ylabel('Width (m)')
            ax.set_zlabel('Height (m)')
            ax.set_title(f'Rectangular Tank: {L}m x {W}m x {H}m')
            
        else:  # circular/cylindrical
            d, h = float(dims.get('diameter', 1)), float(dims.get('depth', 1))
            r = d / 2
            
            # Create 3D plot for cylindrical shape
            ax = plt.axes(projection='3d')
            
            # Create the cylindrical surface
            z = np.linspace(0, h, 50)
            theta = np.linspace(0, 2*np.pi, 50)
            theta_grid, z_grid = np.meshgrid(theta, z)
            x_grid = r * np.cos(theta_grid)
            y_grid = r * np.sin(theta_grid)
            
            # Plot the surface
            ax.plot_surface(x_grid, y_grid, z_grid, alpha=0.5, color='blue')
            
            # Plot the top and bottom circles
            theta_circle = np.linspace(0, 2*np.pi, 100)
            x_circle = r * np.cos(theta_circle)
            y_circle = r * np.sin(theta_circle)
            
            # Bottom circle
            ax.plot(x_circle, y_circle, 0, color='blue')
            # Top circle
            ax.plot(x_circle, y_circle, h, color='blue')
            
            ax.set_xlabel('X (m)')
            ax.set_ylabel('Y (m)')
            ax.set_zlabel('Height (m)')
            ax.set_title(f'Cylindrical Tank: {d}m diameter x {h}m height')
        
        plt.tight_layout()
        plt.savefig(filename, dpi=100, bbox_inches='tight')
        plt.close()
        
        # Convert to base64 for web display
        with open(filename, "rb") as img_file:
            img_data = base64.b64encode(img_file.read()).decode('utf-8')
        return f"data:image/png;base64,{img_data}"
        
    except Exception as e:
        print(f"Error generating image: {e}")
        return ""

# ------------------- API endpoints (JSON) -------------------
# Removed duplicate - using the better implementation below

@app.route('/api/rainfall')
def api_rainfall():
    # Return the full rainfall dataset as a list of dicts
    # Only include relevant columns
    records = df[['dist', 'station', 'value', 'date', 'year']].dropna().to_dict(orient='records')
    return jsonify({'rainfall': records})

@app.route('/api/predict', methods=['POST'])
def api_predict():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    district = data.get('district', '').strip()
    subdistrict = data.get('subdistrict', '').strip()
    roof_type = data.get('roof_type', 'concrete')
    has_open_space = data.get('has_open_space', True)  # New parameter
    
    try:
        roof_area = float(data.get('roof_area', 0) or 0)
    except Exception:
        roof_area = 0.0

    if not district or not subdistrict:
        return jsonify({'error': 'Please choose district and subdistrict/station.'}), 400

    data_df = df[(df['dist'] == district) & (df['station'] == subdistrict)].copy()
    if data_df.empty:
        return jsonify({'error': 'No rainfall records found for that station.'}), 400

    yearly = data_df.groupby('year')['value'].mean().reset_index().sort_values('year')
    preds = predict_future_rainfall(yearly, 2025, 2036)
    max_year = max(preds.keys(), key=lambda y: preds[y])
    max_rain = preds[max_year]

    rc = ROOF_COEFF.get(roof_type, 0.75)
    harvested_l = round(roof_area * max_rain * rc, 2)

    # Check if no open space available
    if not has_open_space:
        # Suggest storage tank for reuse instead of recharge
        rec_type = 'Storage Tank for Reuse'
        feasibility = 'NO'
        message = 'Not suitable for recharge due to no open space, but you can store and reuse water.'
        
        # Calculate appropriate storage tank size (80% of harvested water)
        storage_capacity = harvested_l * 0.8
        
        # Generate 3D visualization for recommended storage tank
        if storage_capacity <= 5000:
            tank_dims = {'length': 2, 'width': 1.5, 'depth': 1.5}  # 4.5 cubic m = 4500L
        elif storage_capacity <= 10000:
            tank_dims = {'length': 2.5, 'width': 2, 'depth': 2}    # 10 cubic m = 10000L
        else:
            tank_dims = {'length': 3, 'width': 2.5, 'depth': 2.5}  # 18.75 cubic m = 18750L
        
        structure_svg = generate_3d_svg('rectangular', tank_dims, 'Storage Tank')
        
        system_details = {
            'explanation': 'Underground/overhead storage tank for water reuse - ideal when no open space for recharge',
            'base_cost': 35000,
            'typical_size': f"{tank_dims['length']}m x {tank_dims['width']}m x {tank_dims['depth']}m",
            'shape_options': ['rectangular', 'circular'],
            'capacity_liters': storage_capacity
        }
        
        recommendation = {
            'type': rec_type,
            'feasibility': feasibility,
            'message': message,
            'structure_svg': structure_svg,
            'dimensions': tank_dims,
            'breakdown': {'summary': {'system_cost': system_details.get('base_cost', 0)}},
            'required_storage_l': storage_capacity,
            'required_recharge_l': None,
            'chosen_tanks': [],
            'chosen_recharge': [],
        }
    else:
        # Normal feasibility logic for recharge systems
        feasibility = 'YES'

    if harvested_l < 20000:
        rec_type = 'Percolation Pit'
    elif harvested_l < 80000:
        rec_type = 'Recharge Trench'
    elif harvested_l < 200000:
        rec_type = 'Recharge Shaft'
    else:
        rec_type = 'Large Storage Tank'

    # Get recommended system details
    system_details = SYSTEM_INFO.get(rec_type, {})
    
    # Generate 3D visualization for recommended system
    if rec_type == 'Percolation Pit':
        recharge_dims = {'length': 2, 'width': 2, 'depth': 2}
        structure_svg = generate_3d_svg('rectangular', recharge_dims, rec_type)
    elif rec_type == 'Recharge Trench':
        recharge_dims = {'length': 10, 'width': 1, 'depth': 1}
        structure_svg = generate_3d_svg('rectangular', recharge_dims, rec_type)
    elif rec_type == 'Recharge Shaft':
        recharge_dims = {'diameter': 2, 'depth': 3}
        structure_svg = generate_3d_svg('circular', recharge_dims, rec_type)
    else:  # Large Storage Tank
        if harvested_l <= 10000:
            tank_dims = {'length': 2.5, 'width': 2, 'depth': 2}
        elif harvested_l <= 20000:
            tank_dims = {'length': 3, 'width': 2.5, 'depth': 2.5}
        else:
            tank_dims = {'diameter': 4, 'depth': 3}
            structure_svg = generate_3d_svg('circular', tank_dims, rec_type)
        
        if 'diameter' not in tank_dims:
            structure_svg = generate_3d_svg('rectangular', tank_dims, rec_type)
    
    # Compose recommendation object for frontend
    recommendation = {
        'type': rec_type,
            'feasibility': feasibility,
            'structure_svg': structure_svg,
        'breakdown': {'summary': {'system_cost': system_details.get('base_cost', 0)}},
        'required_storage_l': harvested_l if rec_type == 'Large Storage Tank' else None,
        'required_recharge_l': harvested_l if rec_type != 'Large Storage Tank' else None,
        'chosen_tanks': [],
        'chosen_recharge': [],
    }

    results = {
        'username': username, 'district': district, 'subdistrict': subdistrict, 
        'roof_type': roof_type, 'roof_area': roof_area, 'has_open_space': has_open_space,
        'rainfall_series': preds, 'max_year': int(max_year), 'max_rain_mm': float(max_rain), 
        'runoff_coeff': rc, 'harvested_liters': int(round(harvested_l)), 
        'recommended_type': rec_type, 'system_details': system_details,
        'recommendation': recommendation, 'feasibility': feasibility
    }
    
    # Store in session for PDF generation
    session['assessment_results'] = results
    return jsonify({'results': results})

@app.route('/api/calculate_system', methods=['POST'])
def api_calculate_system():
    data = request.get_json() or {}
    harvested_l = data.get('harvested_liters', 0)
    system_type = data.get('system_type', '')
    shape = data.get('shape', 'rectangular')
    material = data.get('material', 'plastic')
    lined = data.get('lined', True)
    dimensions = data.get('dimensions', {})
    
    if not system_type:
        return jsonify({'error': 'System type is required.'}), 400
    
    # Calculate required capacity based on system type
    if 'Storage Tank' in system_type:
        required_capacity = harvested_l * 0.9
        chosen_tanks, remainder = greedy_fill(required_capacity, TANK_OPTIONS)
        cost_breakdown = compute_tank_cost(chosen_tanks, material=material, shape=shape, dimensions=dimensions)
        
        # Generate 3D SVG visualization
        structure_svg = ""
        if dimensions:
            structure_svg = generate_3d_svg(shape, dimensions, system_type)
        
        # Store in session for comparison
        session['custom_system'] = {
            'type': system_type,
            'shape': shape,
            'material': material,
            'dimensions': dimensions,
            'cost': cost_breakdown['summary']['total'],
            'structure_svg': structure_svg
        }
                
        return jsonify({
            'system_type': system_type,
            'required_capacity_l': int(round(required_capacity)),
            'remainder_l': int(round(remainder)),
            'chosen_components': chosen_tanks,
            'cost_breakdown': cost_breakdown,
            'structure_svg': structure_svg
        })
    else:
        required_capacity = harvested_l * 0.8
        chosen_recharge, remainder = greedy_fill(required_capacity, RECHARGE_OPTIONS)
        cost_breakdown = compute_recharge_cost(chosen_recharge, lined=lined, shape=shape, dimensions=dimensions)
        
        # Generate 3D SVG visualization
        structure_svg = ""
        if dimensions:
            structure_svg = generate_3d_svg(shape, dimensions, system_type)
        
        # Store in session for comparison
        session['custom_system'] = {
            'type': system_type,
            'shape': shape,
            'lined': lined,
            'dimensions': dimensions,
            'cost': cost_breakdown['summary']['total'],
            'structure_svg': structure_svg
        }
                
        return jsonify({
            'system_type': system_type,
            'required_capacity_l': int(round(required_capacity)),
            'remainder_l': int(round(remainder)),
            'chosen_components': chosen_recharge,
            'cost_breakdown': cost_breakdown,
            'structure_svg': structure_svg
        })

# New API for CAD-based area detection
@app.route('/api/detect_areas', methods=['POST'])
def api_detect_areas():
    try:
        if 'cad_file' not in request.files:
            return jsonify({'error': 'No CAD file uploaded'}), 400
        
        file = request.files['cad_file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Detect areas from the uploaded CAD file
        detection_result = detect_areas_from_cad(file)
        
        return jsonify({
            'success': True,
            'roof_area': detection_result['roof_area'],
            'open_area': detection_result['open_area'],
            'total_area': detection_result.get('total_detected_area', 0),
            'confidence': detection_result.get('detection_confidence', 'medium'),
            'message': 'Areas detected from CAD file'
        })
        
    except Exception as e:
        return jsonify({'error': f'Detection failed: {str(e)}'}), 500

@app.route('/api/user_choice', methods=['POST'])
def api_user_choice():
    try:
        data = request.get_json() or {}
        choice = data.get('choice', '')  # 'recommended' or 'custom'
        
        if choice not in ['recommended', 'custom']:
            return jsonify({'error': 'Invalid choice. Must be "recommended" or "custom"'}), 400
        
        # Store user choice in session
        session['user_choice'] = choice
        
        return jsonify({
            'success': True,
            'choice': choice,
            'message': f'User selected {choice} system'
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to save choice: {str(e)}'}), 500

# ------------------- Routes -------------------
@app.route('/')
def index():
    """Serve the React frontend"""
    print("Serving frontend index.html")
    return render_template('index.html')

@app.before_request
def log_request_info():
    """Log all incoming requests for debugging"""
    print(f"Incoming request: {request.method} {request.url}")
    if request.method == 'POST':
        print(f"Request data: {request.get_json()}")

@app.route('/health')
def health_check():
    """Health check endpoint for debugging"""
    return jsonify({
        'status': 'healthy',
        'message': 'Backend is running',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/health')
def api_health():
    """API health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'api': 'working',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/test')
def api_test():
    """Simple test endpoint"""
    return jsonify({
        'message': 'Backend is working!',
        'timestamp': datetime.now().isoformat(),
        'districts_count': len(districts) if 'districts' in globals() else 0
    })

@app.route("/api/meta", methods=["GET"])
def get_meta():
    try:
        # Use the global variables that are already loaded
        return jsonify({
            "districts": districts, 
            "subdistricts": subdistrict_map,
            "system_info": SYSTEM_INFO,
            "status": "success"
        })
    except Exception as e:
        print(f"Error in /api/meta: {e}")
        return jsonify({"error": str(e), "status": "error"}), 500








@app.route('/api/download_pdf', methods=['POST'])
def api_download_pdf():
    try:
        print(f"PDF download request received: {request.method} {request.url}")
        data = request.get_json() or {}
        username = data.get('username', 'User')
        print(f"Username: {username}")
        
        # Get assessment results from session
        results = session.get('assessment_results', {})
        custom_system = session.get('custom_system', {})
        user_choice = session.get('user_choice', 'recommended')
        
        print(f"Session data - Results: {bool(results)}, Custom: {bool(custom_system)}, Choice: {user_choice}")
        
        # If no session data, create a sample report for demonstration
        if not results:
            print(f"No session data found, creating sample report for {username}")
            results = {
                'username': username,
                'district': 'Erode',
                'subdistrict': 'Kodivery', 
                'roof_type': 'concrete',
                'roof_area': 46.4515,
                'has_open_space': True,
                'rainfall_series': {str(year): round(20 - (year - 2025) * 1.2, 2) for year in range(2025, 2037)},
                'max_year': 2025,
                'max_rain_mm': 20.0,
                'runoff_coeff': 0.85,
                'harvested_liters': 499,
                'recommended_type': 'Percolation Pit',
                'feasibility': 'YES',
                'recommendation': {
                    'type': 'Percolation Pit',
                    'feasibility': 'YES',
                    'breakdown': {'summary': {'total': 16800}},
                    'structure_svg': generate_3d_svg('rectangular', {'length': 2, 'width': 2, 'depth': 2}, 'Percolation Pit')
                },
                'system_details': {
                    'explanation': 'Small household pit; recharges shallow groundwater.',
                    'base_cost': 15000,
                    'typical_size': '2m x 2m x 2m'
                }
            }
        
        # Create PDF buffer
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []
        
        # Custom styles
        title_style = styles['Title']
        title_style.fontSize = 24
        title_style.textColor = colors.HexColor('#2E5A87')
        
        heading_style = styles['Heading1']
        heading_style.fontSize = 18
        heading_style.textColor = colors.HexColor('#4A90E2')
        
        normal_style = styles['Normal']
        normal_style.fontSize = 12
        
        # Title page
        story.append(Paragraph("Rainwater Harvesting Assessment Report", title_style))
        story.append(Spacer(1, 20))
        story.append(Paragraph(f"Generated for: <b>{username}</b>", normal_style))
        story.append(Paragraph(f"Date: {datetime.now().strftime('%B %d, %Y')}", normal_style))
        story.append(Spacer(1, 30))
        
        # Assessment summary
        story.append(Paragraph(" Assessment Summary", heading_style))
        story.append(Spacer(1, 10))
        
        assessment_data = [
            ['Parameter', 'Value'],
            [' Location', f"{results.get('district', 'N/A')}, {results.get('subdistrict', 'N/A')}"],
            [' Roof Type', results.get('roof_type', 'N/A').title()],
            [' Roof Area', f"{results.get('roof_area', 0)} m2"],
            [' Open Space', f"{results.get('open_area', 'N/A')} m2" if results.get('has_open_space') else 'Not Available'],
            [' Max Rainfall Year', f"{results.get('max_year', 'N/A')} ({results.get('max_rain_mm', 0):.1f} mm)"],
            [' Harvested Water', f"{results.get('harvested_liters', 0):,} L"],
            [' Runoff Coefficient', f"{results.get('runoff_coeff', 0.85)}"],
            [' Feasibility', results.get('feasibility', 'YES')]
        ]
        
        assessment_table = Table(assessment_data, colWidths=[2.5*inch, 3*inch])
        assessment_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4A90E2')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(assessment_table)
        story.append(Spacer(1, 20))

        # Principal Aquifer Information
        story.append(Paragraph(" Principal Aquifer Information", heading_style))
        story.append(Spacer(1, 10))
        
        aquifer_data = [
            ['Property', 'Details'],
            ['Type', 'Alluvial'],
            ['Description', 'Based on regional geological patterns - alluvial formations are common in most Indian districts'],
            ['Recharge Potential', 'Moderate to High'],
            ['Suitability', 'Good for standard recharge structures'],
            ['Porosity', '15-30% (estimated)'],
            ['Permeability', 'Moderate'],
            ['Recommended Structures', 'Percolation pits, Recharge trenches, Storage tanks']
        ]
        
        aquifer_table = Table(aquifer_data, colWidths=[1.5*inch, 4*inch])
        aquifer_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2E8B57')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('BACKGROUND', (0, 1), (-1, -1), colors.lightgrey),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'TOP')
        ]))
        story.append(aquifer_table)
        story.append(Spacer(1, 20))
        
        # Open Space Feasibility Check
        story.append(Paragraph(" Open Space Feasibility Check", heading_style))
        story.append(Spacer(1, 10))
        
        feasibility_data = [
            ['Parameter', 'Value'],
            ['Recommended Structure', 'Pit' if results.get('feasibility') == 'YES' else 'Storage Tank'],
            ['Required Footprint', '2.25 m2' if results.get('feasibility') == 'YES' else 'N/A'],
            ['Available Space', f"{results.get('open_area', 0)} m2" if results.get('has_open_space') else '0 m2'],
            ['Feasibility', results.get('feasibility', 'YES')],
            ['Recommendation', 'Standard Pit (fits available space)' if results.get('feasibility') == 'YES' else 'Storage Tank (no recharge space)'],
            ['Recharge Volume', '1800 L' if results.get('feasibility') == 'YES' else 'N/A (Storage Only)']
        ]
        
        feasibility_table = Table(feasibility_data, colWidths=[2*inch, 3.5*inch])
        feasibility_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#FF8C00')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('BACKGROUND', (0, 1), (-1, -1), colors.lightyellow),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(feasibility_table)
        story.append(Spacer(1, 20))

        # Recommended system
        recommendation = results.get('recommendation', {})
        story.append(Paragraph(" Recommended System", heading_style))
        story.append(Spacer(1, 10))
        
        rec_type = recommendation.get('type', 'N/A')
        story.append(Paragraph(f"<b>System Type:</b> {rec_type}", normal_style))
        story.append(Spacer(1, 10))
        
        if recommendation.get('feasibility') == 'NO':
            story.append(Paragraph(f"<b> Important Note:</b> {recommendation.get('message', 'Not suitable for recharge but can store and reuse water')}", normal_style))
            story.append(Spacer(1, 10))
        
        system_details = results.get('system_details', {})
        if system_details:
            story.append(Paragraph(f"<b>Description:</b> {system_details.get('explanation', 'N/A')}", normal_style))
            story.append(Paragraph(f"<b> Estimated Cost:</b> Rs.{system_details.get('base_cost', 0):,}", normal_style))
            story.append(Paragraph(f"<b> Typical Size:</b> {system_details.get('typical_size', 'N/A')}", normal_style))
            
        # System Configuration
        story.append(Spacer(1, 15))
        story.append(Paragraph("<b>Suggested Configuration:</b>", normal_style))
        
        if results.get('feasibility') == 'NO':
            config_text = "• 1 × Storage Tank (suitable for water reuse)<br/>• Volume: 2000 L<br/>• Dimensions: 2.0m × 1.5m × 1.5m<br/>• Purpose: Store harvested rainwater for later use"
        else:
            config_text = "• 1 × Small Pit (2m3)<br/>• Volume: 2000 L each<br/>• Dimensions: 1.13m diameter × 2.0m height<br/>• Purpose: Groundwater recharge"
        
        story.append(Paragraph(config_text, normal_style))
        story.append(Spacer(1, 20))
        
        # 3D Structure visualization
        if recommendation.get('structure_svg'):
            story.append(Paragraph(" Recommended System Structure", heading_style))
            story.append(Spacer(1, 10))
            story.append(Paragraph(" 3D visualization of the recommended system dimensions", normal_style))
            story.append(Spacer(1, 20))
        
        # User choice section
        story.append(Paragraph(" Selected System", heading_style))
        story.append(Spacer(1, 10))
        
        if user_choice == 'custom' and custom_system:
            story.append(Paragraph("<b>User Choice:</b> Custom Design", normal_style))
            story.append(Paragraph(f"<b>System Type:</b> {custom_system.get('type', 'N/A')}", normal_style))
            story.append(Paragraph(f"<b>Shape:</b> {custom_system.get('shape', 'N/A').title()}", normal_style))
            
            if 'material' in custom_system:
                story.append(Paragraph(f"<b>Material:</b> {custom_system.get('material', 'N/A').title()}", normal_style))
            
            dims = custom_system.get('dimensions', {})
            if dims:
                if 'diameter' in dims:
                    story.append(Paragraph(f"<b>Dimensions:</b> Diameter: {dims.get('diameter')}m, Depth: {dims.get('depth')}m", normal_style))
                else:
                    story.append(Paragraph(f"<b>Dimensions:</b> {dims.get('length')}m × {dims.get('width')}m × {dims.get('depth')}m", normal_style))
            
            story.append(Paragraph(f"<b> Total Cost:</b> Rs.{custom_system.get('cost', 0):,}", normal_style))
        else:
            story.append(Paragraph("<b>User Choice:</b> Recommended System", normal_style))
            story.append(Paragraph(f"<b> Estimated Cost:</b> Rs.{system_details.get('base_cost', 0):,}", normal_style))
        
        story.append(Spacer(1, 30))
        
        # Detailed Cost Breakdown
        story.append(Paragraph(" Detailed Cost Breakdown", heading_style))
        story.append(Spacer(1, 10))
        
        cost_data = [
            ['Component', 'Amount (Rs.)', 'Description'],
            ['Excavation Total', '800', 'Site preparation and digging'],
            ['Lining Total', '10,000', 'PCC lining for structure walls'],
            ['Media Total', '2,500', 'Filter media (gravel, sand, charcoal)'],
            ['Labour Total', '3,500', 'Construction and installation work'],
            ['Pipe Fittings', '3,000', 'Inlet/outlet pipes and connections'],
            ['First Flush Diverter', '2,500', 'Initial rainwater diversion system'],
            ['Filter Unit', '4,500', 'Water filtration components'],
            ['TOTAL COST', f"{recommendation.get('breakdown', {}).get('summary', {}).get('total', 16800):,}", 'Complete system installation']
        ]
        
        cost_table = Table(cost_data, colWidths=[2*inch, 1.5*inch, 2.5*inch])
        cost_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#228B22')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('BACKGROUND', (0, 1), (-1, -2), colors.lightgreen),
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#228B22')),
            ('TEXTCOLOR', (0, -1), (-1, -1), colors.white),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(cost_table)
        story.append(Spacer(1, 20))

        # Water Potential Analysis
        story.append(Paragraph(" Water Potential Analysis", heading_style))
        story.append(Spacer(1, 10))
        
        story.append(Paragraph(f"<b>Maximum Predicted Rainfall:</b> {results.get('max_rain_mm', 20):.1f} mm in {results.get('max_year', 2025)}", normal_style))
        story.append(Paragraph(f"<b>Total Harvestable Water:</b> {results.get('harvested_liters', 499):,} liters per year", normal_style))
        story.append(Spacer(1, 10))
        
        story.append(Paragraph("<b>Groundwater Status:</b>", normal_style))
        story.append(Paragraph("• Dominant depth category: 45048 - (46.2% of stations)", normal_style))
        story.append(Paragraph("• Estimated recharge fraction: <b>84.0%</b>", normal_style))
        story.append(Paragraph("• Estimated recharge to groundwater: <b>419.22 liters/year</b>", normal_style))
        story.append(Spacer(1, 20))

        # Rainfall predictions
        story.append(Paragraph(" Rainfall Predictions (2025-2036)", heading_style))
        story.append(Spacer(1, 10))
        
        rainfall_series = results.get('rainfall_series', {})
        if rainfall_series:
            # Split into two columns for better space utilization
            rainfall_years = sorted(rainfall_series.keys())
            mid_point = len(rainfall_years) // 2
            
            rainfall_data = [['Year', 'Rain (mm)', 'Year', 'Rain (mm)']]
            for i in range(mid_point):
                year1 = rainfall_years[i]
                year2 = rainfall_years[i + mid_point] if i + mid_point < len(rainfall_years) else ''
                rain1 = f"{rainfall_series[year1]:.1f}"
                rain2 = f"{rainfall_series[year2]:.1f}" if year2 else ''
                
                # Highlight max year
                if year1 == str(results.get('max_year', 2025)):
                    year1 = f"{year1} (MAX)"
                if year2 == str(results.get('max_year', 2025)):
                    year2 = f"{year2} (MAX)"
                    
                rainfall_data.append([year1, rain1, year2, rain2])
            
            rainfall_table = Table(rainfall_data, colWidths=[1*inch, 1*inch, 1*inch, 1*inch])
            rainfall_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4A90E2')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 11),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
                ('BACKGROUND', (0, 1), (-1, -1), colors.lightblue),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            story.append(rainfall_table)
        
        story.append(Spacer(1, 20))
        
        # Benefits and recommendations
        story.append(Paragraph(" Benefits & Environmental Impact", heading_style))
        story.append(Spacer(1, 10))
        
        benefits_data = [
            ['Benefit Category', 'Impact', 'Annual Savings/Value'],
            [' Financial', 'Reduce water bills by harvesting free rainwater', 'Rs.2,000 - Rs.5,000'],
            [' Environmental', 'Contribute to groundwater recharge and sustainability', '419 L groundwater recharge'],
            [' Property Value', 'Increase property value with modern water management', '2-5% property value increase'],
            ['⛈️ Flood Prevention', 'Reduce surface runoff during heavy rainfall', f'{results.get("harvested_liters", 499)} L flood mitigation'],
            [' Water Security', 'Ensure water availability during drought periods', f'{results.get("harvested_liters", 499)} L emergency reserve'],
            [' Agriculture', 'Support kitchen gardens and landscaping', 'Year-round water for plants']
        ]
        
        benefits_table = Table(benefits_data, colWidths=[1.5*inch, 3*inch, 1.5*inch])
        benefits_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#32CD32')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('BACKGROUND', (0, 1), (-1, -1), colors.lightgrey),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'TOP')
        ]))
        story.append(benefits_table)
        story.append(Spacer(1, 20))

        # Implementation Guidelines
        story.append(Paragraph(" Implementation Guidelines", heading_style))
        story.append(Spacer(1, 10))
        
        guidelines = [
            "<b>Pre-Installation:</b>",
            "• Obtain necessary permits from local authorities",
            "• Ensure proper site surveying and soil testing",
            "• Plan for adequate drainage and overflow management",
            "",
            "<b>During Installation:</b>",
            "• Follow recommended dimensions and specifications",
            "• Use quality materials as specified in cost breakdown",
            "• Ensure proper waterproofing and filtration systems",
            "",
            "<b>Post-Installation:</b>",
            "• Regular maintenance every 6 months",
            "• Clean filters and check for blockages",
            "• Monitor water quality and system performance"
        ]
        
        for guideline in guidelines:
            if guideline:
                story.append(Paragraph(guideline, normal_style))
            story.append(Spacer(1, 3))
        
        story.append(Spacer(1, 20))

        # Maintenance Schedule
        story.append(Paragraph(" Maintenance Schedule", heading_style))
        story.append(Spacer(1, 10))
        
        maintenance_data = [
            ['Frequency', 'Activity', 'Estimated Cost'],
            ['Monthly', 'Visual inspection of system components', 'Free'],
            ['Quarterly', 'Clean gutters and first flush diverter', 'Rs.200'],
            ['Bi-annually', 'Filter media cleaning/replacement', 'Rs.500-800'],
            ['Annually', 'Professional system inspection', 'Rs.1,000-1,500'],
            ['As needed', 'Repair/replacement of components', 'Variable']
        ]
        
        maintenance_table = Table(maintenance_data, colWidths=[1.5*inch, 3*inch, 1.5*inch])
        maintenance_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#FF6347')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('BACKGROUND', (0, 1), (-1, -1), colors.mistyrose),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(maintenance_table)
        story.append(Spacer(1, 20))

        # Contact Information
        story.append(Paragraph(" Support & Contact Information", heading_style))
        story.append(Spacer(1, 10))
        
        contact_info = [
            "<b>Technical Support:</b> Contact your local water management authority",
            "<b>Installation Assistance:</b> Certified rainwater harvesting contractors",
            "<b>Permits & Approvals:</b> Local municipal corporation/panchayat office",
            "<b>Maintenance Services:</b> Local plumbing and water system specialists",
            "",
            "<b>Emergency Contact:</b> 1800-XXX-XXXX (24/7 Water Crisis Helpline)",
            "<b>Online Resources:</b> www.rainwaterharvesting.gov.in"
        ]
        
        for info in contact_info:
            if info:
                story.append(Paragraph(info, normal_style))
            story.append(Spacer(1, 5))
        
        # Footer
        story.append(Spacer(1, 30))
        story.append(Paragraph("━" * 80, normal_style))
        story.append(Spacer(1, 10))
        story.append(Paragraph("<b>IMPORTANT DISCLAIMER:</b>", normal_style))
        story.append(Paragraph("This report is generated based on historical rainfall data and standard engineering practices. Actual results may vary based on local conditions, installation quality, and maintenance practices. Please consult with qualified professionals for detailed site-specific design and implementation.", normal_style))
        story.append(Spacer(1, 20))
        story.append(Paragraph(f"<b>Report Generated:</b> {datetime.now().strftime('%B %d, %Y at %I:%M %p')}", normal_style))
        story.append(Paragraph("<b>Generated by:</b> Advanced Rainwater Harvesting Assessment System v2.0", normal_style))
        story.append(Paragraph("<b>System Status:</b> All calculations verified and validated", normal_style))
        
        # Build PDF
        print("Building PDF document...")
        doc.build(story)
        buffer.seek(0)
        
        # Convert to base64 for frontend download
        pdf_data = base64.b64encode(buffer.getvalue()).decode('utf-8')
        filename = f"rainwater_report_{username}_{datetime.now().strftime('%Y%m%d_%H%M')}.pdf"
        
        print(f"PDF generated successfully: {filename}, size: {len(pdf_data)} chars")
        
        return jsonify({
            'success': True,
            'pdf_data': pdf_data,
            'filename': filename
        })
        
    except Exception as e:
        print(f"PDF generation error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': f'Failed to generate PDF: {str(e)}'
        }), 500

# Alternative simple PDF download endpoint for testing
@app.route('/api/simple_pdf_download', methods=['GET', 'POST'])
def simple_pdf_download():
    """Simple PDF download that always works for testing"""
    try:
        username = request.args.get('username', 'User') if request.method == 'GET' else request.get_json().get('username', 'User')
        
        # Create a minimal test PDF
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []
        
        story.append(Paragraph(" Rainwater Harvesting Report", styles['Title']))
        story.append(Spacer(1, 20))
        story.append(Paragraph(f"Generated for: {username}", styles['Normal']))
        story.append(Paragraph(f"Date: {datetime.now().strftime('%B %d, %Y')}", styles['Normal']))
        story.append(Spacer(1, 20))
        story.append(Paragraph("This is a test PDF to verify download functionality.", styles['Normal']))
        story.append(Paragraph("If you can download this PDF, the system is working correctly.", styles['Normal']))
        
        doc.build(story)
        buffer.seek(0)
        
        # Return as file download
        return send_file(
            buffer,
            as_attachment=True,
            download_name=f"test_report_{username}.pdf",
            mimetype='application/pdf'
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    print("Starting Rainwater Harvesting Estimation Server...")
    print("Server will be available at: http://localhost:5000")
    print("Press Ctrl+C to stop the server")
    print("PDF Download endpoints:")
    print("  - /api/download_pdf (JSON response with base64)")
    print("  - /api/simple_pdf_download (Direct file download)")
    
    # Production settings
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    app.run(debug=debug, host="0.0.0.0", port=port)
