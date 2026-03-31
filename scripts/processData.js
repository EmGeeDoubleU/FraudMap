import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CSV_DIR = path.join(ROOT, 'data', 'CSVs');
const OUT_DIR = path.join(ROOT, 'public', 'data');

// ── MSA name → [lat, lng] ──────────────────────────────────────────────
// Keys are the MSA names with the Statistical Area suffix stripped.
const MSA_COORDS = {
  "Miami-Fort Lauderdale-West Palm Beach, FL": [25.7617, -80.1918],
  "Atlanta-Sandy Springs-Roswell, GA": [33.749, -84.388],
  "Sebastian-Vero Beach-West Vero Corridor, FL": [27.8164, -80.4706],
  "Orlando-Kissimmee-Sanford, FL": [28.5383, -81.3792],
  "North Port-Bradenton-Sarasota, FL": [27.3364, -82.5307],
  "Charleston-North Charleston, SC": [32.7765, -79.9311],
  "Lakeland-Winter Haven, FL": [28.0395, -81.9498],
  "Las Vegas-Henderson-North Las Vegas, NV": [36.1699, -115.1398],
  "Tampa-St. Petersburg-Clearwater, FL": [27.9506, -82.4572],
  "Dallas-Fort Worth-Arlington, TX": [32.7767, -96.797],
  "Palm Bay-Melbourne-Titusville, FL": [28.0345, -80.5887],
  "East Stroudsburg, PA": [41.0031, -75.181],
  "Tuscaloosa, AL": [33.2098, -87.5692],
  "Philadelphia-Camden-Wilmington, PA-NJ-DE-MD": [39.9526, -75.1652],
  "Jacksonville, FL": [30.3322, -81.6557],
  "Port St. Lucie, FL": [27.273, -80.3582],
  "Odessa, TX": [31.8457, -102.3676],
  "Houston-Pasadena-The Woodlands, TX": [29.7604, -95.3698],
  "Memphis, TN-MS-AR": [35.1495, -90.049],
  "Baltimore-Columbia-Towson, MD": [39.2904, -76.6122],
  "Savannah, GA": [32.0809, -81.0912],
  "Warner Robins, GA": [32.613, -83.6238],
  "Baton Rouge, LA": [30.4515, -91.1871],
  "Lubbock, TX": [33.5779, -101.8552],
  "Charlotte-Concord-Gastonia, NC-SC": [35.2271, -80.8431],
  "Shreveport-Bossier City, LA": [32.5252, -93.7502],
  "Washington-Arlington-Alexandria, DC-VA-MD-WV": [38.9072, -77.0369],
  "New Orleans-Metairie, LA": [29.9511, -90.0715],
  "Montgomery, AL": [32.3792, -86.3077],
  "Birmingham, AL": [33.5186, -86.8104],
  "Deltona-Daytona Beach-Ormond Beach, FL": [29.2108, -81.0228],
  "Killeen-Temple, TX": [31.1171, -97.7278],
  "Columbus, GA-AL": [32.461, -84.9877],
  "Dover, DE": [39.1582, -75.5244],
  "Chicago-Naperville-Elgin, IL-IN": [41.8781, -87.6298],
  "Punta Gorda, FL": [26.9298, -82.0454],
  "Fayetteville, NC": [35.0527, -78.8784],
  "Macon-Bibb County, GA": [32.8407, -83.6324],
  "Tallahassee, FL": [30.4383, -84.2807],
  "Allentown-Bethlehem-Easton, PA-NJ": [40.6023, -75.4714],
  "Ocala, FL": [29.1872, -82.1401],
  "Columbia, SC": [34.0007, -81.0348],
  "Lafayette, LA": [30.2241, -92.0198],
  "Alexandria, LA": [31.3113, -92.4451],
  "Augusta-Richmond County, GA-SC": [33.4735, -82.0105],
  "Huntsville, AL": [34.7304, -86.5861],
  "Cape Coral-Fort Myers, FL": [26.631, -81.8574],
  "Virginia Beach-Chesapeake-Norfolk, VA-NC": [36.8529, -75.978],
  "New York-Newark-Jersey City, NY-NJ": [40.7128, -74.006],
  "Phoenix-Mesa-Chandler, AZ": [33.4484, -112.074],
  "Mobile, AL": [30.6954, -88.0399],
  "Detroit-Warren-Dearborn, MI": [42.3314, -83.0458],
  "Richmond, VA": [37.5407, -77.436],
  "Gainesville, FL": [29.6516, -82.3248],
  "Myrtle Beach-Conway-North Myrtle Beach, SC": [33.6891, -78.8867],
  "Lumberton, NC": [34.6182, -79.0086],
  "Austin-Round Rock-San Marcos, TX": [30.2672, -97.7431],
  "St. Louis, MO-IL": [38.627, -90.1994],
  "Raleigh-Cary, NC": [35.7796, -78.6382],
  "Kankakee, IL": [41.12, -87.8612],
  "Indianapolis-Carmel-Greenwood, IN": [39.7684, -86.1581],
  "Elizabethtown, KY": [37.694, -85.8591],
  "Fort Collins-Loveland, CO": [40.5853, -105.0844],
  "Los Angeles-Long Beach-Anaheim, CA": [34.0522, -118.2437],
  "Prescott Valley-Prescott, AZ": [34.61, -112.3154],
  "Homosassa Springs, FL": [28.8003, -82.5757],
  "Cleveland, OH": [41.4993, -81.6944],
  "Vallejo, CA": [38.1041, -122.2566],
  "Trenton-Princeton, NJ": [40.2206, -74.7642],
  "Greenville-Anderson-Greer, SC": [34.8526, -82.394],
  "Greensboro-High Point, NC": [36.0726, -79.792],
  "Naples-Marco Island, FL": [26.142, -81.7948],
  "Panama City-Panama City Beach, FL": [30.1588, -85.6602],
  "San Antonio-New Braunfels, TX": [29.4241, -98.4936],
  "Pensacola-Ferry Pass-Brent, FL": [30.4213, -87.2169],
  "Florence, SC": [34.1954, -79.7626],
  "LaGrange, GA-AL": [33.0362, -85.0322],
  "Sumter, SC": [33.9204, -80.3416],
  "Sebring, FL": [27.4954, -81.4409],
  "Sacramento-Roseville-Folsom, CA": [38.5816, -121.4944],
  "Greenville, NC": [35.6127, -77.3664],
  "Tucson, AZ": [32.2226, -110.9747],
  "Boulder, CO": [40.015, -105.2705],
  "Little Rock-North Little Rock-Conway, AR": [34.7465, -92.2896],
  "Colorado Springs, CO": [38.8339, -104.8214],
  "Columbus, OH": [39.9612, -82.9988],
  "Durham-Chapel Hill, NC": [35.994, -78.8986],
  "Seaford, DE": [38.6413, -75.611],
  "San Diego-Chula Vista-Carlsbad, CA": [32.7157, -117.1611],
  "Rocky Mount, NC": [35.9382, -77.7905],
  "Denver-Aurora-Centennial, CO": [39.7392, -104.9903],
  "Wildwood-The Villages, FL": [28.7647, -82.0079],
  "Riverside-San Bernardino-Ontario, CA": [33.9533, -117.3962],
  "Jackson, MS": [32.2988, -90.1848],
  "Albany, GA": [31.5785, -84.1557],
  "New Haven, CT": [41.3083, -72.9279],
  "Lake Havasu City-Kingman, AZ": [34.4839, -114.3225],
  "Sierra Vista-Douglas, AZ": [31.5455, -110.2773],
  "San Francisco-Oakland-Fremont, CA": [37.7749, -122.4194],
  "Akron, OH": [41.0814, -81.519],
  "Asheville, NC": [35.5951, -82.5515],
  "Atlantic City-Hammonton, NJ": [39.3643, -74.4229],
  "Clarksville, TN-KY": [36.5298, -87.3595],
  "Midland, TX": [31.9973, -102.0779],
  "Truckee-Grass Valley, CA": [39.328, -120.1833],
  "Spartanburg, SC": [34.9496, -81.932],
  "Kiryas Joel-Poughkeepsie-Newburgh, NY": [41.7004, -74.006],
  "Scranton--Wilkes-Barre, PA": [41.409, -75.6624],
  "Winchester, VA-WV": [39.1857, -78.1633],
  "Seattle-Tacoma-Bellevue, WA": [47.6062, -122.3321],
  "Bridgeport-Stamford-Danbury, CT": [41.1865, -73.1952],
  "Slidell-Mandeville-Covington, LA": [30.2752, -89.7812],
  "Nashville-Davidson--Murfreesboro--Franklin, TN": [36.1627, -86.7816],
  "Santa Fe, NM": [35.687, -105.9378],
  "Pittsburgh, PA": [40.4406, -79.9959],
  "Vineland, NJ": [39.4863, -75.026],
  "Milwaukee-Waukesha, WI": [43.0389, -87.9065],
  "Flint, MI": [43.0125, -83.6875],
  "Hagerstown-Martinsburg, MD-WV": [39.6418, -77.72],
  "Harrisburg-Carlisle, PA": [40.2732, -76.8867],
  "Tyler, TX": [32.3513, -95.3011],
  "Olympia-Lacey-Tumwater, WA": [47.0379, -122.9007],
  "Boston-Cambridge-Newton, MA-NH": [42.3601, -71.0589],
  "Hartford-West Hartford-East Hartford, CT": [41.7658, -72.6734],
  "El Paso, TX": [31.7619, -106.485],
  "Reno, NV": [39.5296, -119.8138],
  "Wilmington, NC": [34.2257, -77.9447],
  "Anderson Creek, NC": [35.2835, -79.0686],
  "Portland-Vancouver-Hillsboro, OR-WA": [45.5155, -122.6789],
  "Waterbury-Shelton, CT": [41.5582, -73.0515],
  "Lexington Park, MD": [38.2668, -76.4339],
  "Valdosta, GA": [30.8327, -83.2785],
  "Chattanooga, TN-GA": [35.0456, -85.3097],
  "Bremerton-Silverdale-Port Orchard, WA": [47.5673, -122.6329],
  "Rockford, IL": [42.2711, -89.094],
  "Ann Arbor, MI": [42.2808, -83.743],
  "Reading, PA": [40.3357, -75.9269],
  "Hilton Head Island-Bluffton-Port Royal, SC": [32.2163, -80.7526],
  "Roanoke, VA": [37.271, -79.9414],
  "Crestview-Fort Walton Beach-Destin, FL": [30.7621, -86.5726],
  "Manchester-Nashua, NH": [42.9956, -71.4548],
  "Brunswick-St. Simons, GA": [31.1499, -81.4915],
  "Kingston, NY": [41.927, -73.9974],
  "Omaha, NE-IA": [41.2565, -95.9345],
  "Albany-Schenectady-Troy, NY": [42.6526, -73.7562],
  "Albuquerque, NM": [35.0844, -106.6504],
  "Gulfport-Biloxi, MS": [30.3674, -89.0928],
  "San Jose-Sunnyvale-Santa Clara, CA": [37.3382, -121.8863],
  "Oxnard-Thousand Oaks-Ventura, CA": [34.1975, -119.1771],
  "Lexington-Fayette, KY": [38.0406, -84.5037],
  "New Bern, NC": [35.1085, -77.0441],
  "Kalamazoo-Portage, MI": [42.2917, -85.5872],
  "Longview, TX": [32.5007, -94.7405],
  "Cheyenne, WY": [41.14, -104.8202],
  "Monroe, LA": [32.5093, -92.1193],
  "Anniston-Oxford, AL": [33.6598, -85.8316],
  "Burlington, NC": [36.0957, -79.4378],
  "Kansas City, MO-KS": [39.0997, -94.5786],
  "Champaign-Urbana, IL": [40.1164, -88.2434],
  "Torrington, CT": [41.8007, -73.1212],
  "Daphne-Fairhope-Foley, AL": [30.6035, -87.9036],
  "Hammond, LA": [30.5044, -90.4612],
  "Hattiesburg, MS": [31.3271, -89.2903],
  "Beaumont-Port Arthur, TX": [30.0802, -94.1266],
  "Auburn-Opelika, AL": [32.6099, -85.4808],
  "Eugene-Springfield, OR": [44.0521, -123.0868],
  "Spokane-Spokane Valley, WA": [47.6588, -117.426],
  "Winston-Salem, NC": [36.0999, -80.2442],
  "Dayton-Kettering-Beavercreek, OH": [39.7589, -84.1916],
  "Springfield, MA": [42.1015, -72.5898],
  "Bellingham, WA": [48.7519, -122.4787],
  "Bend, OR": [44.0582, -121.3153],
  "San Luis Obispo-Paso Robles, CA": [35.2828, -120.6596],
  "Stockton-Lodi, CA": [37.9577, -121.2908],
  "Jacksonville, NC": [34.7541, -77.4303],
  "Rochester, NY": [43.1566, -77.6088],
  "Pueblo, CO": [38.2544, -104.6091],
  "Cincinnati, OH-KY-IN": [39.1031, -84.512],
  "Norwich-New London-Willimantic, CT": [41.3565, -72.09],
  "Louisville/Jefferson County, KY-IN": [38.2527, -85.7585],
  "Oklahoma City, OK": [35.4676, -97.5164],
  "Hot Springs, AR": [34.5037, -93.0552],
  "Charlottesville, VA": [38.0293, -78.4767],
  "Shelby-Kings Mountain, NC": [35.2924, -81.5357],
  "Bakersfield-Delano, CA": [35.3733, -119.0187],
  "Toledo, OH": [41.6528, -83.5379],
  "Salt Lake City-Murray, UT": [40.7608, -111.891],
  "Providence-Warwick, RI-MA": [41.824, -71.4128],
  "Springfield, IL": [39.7817, -89.6501],
  "Anchorage, AK": [61.2181, -149.9003],
  "Minneapolis-St. Paul-Bloomington, MN-WI": [44.9778, -93.265],
  "Missoula, MT": [46.8721, -113.994],
  "Fresno, CA": [36.7378, -119.7871],
  "Amarillo, TX": [35.222, -101.8313],
  "Santa Rosa-Petaluma, CA": [38.4405, -122.7141],
  "Santa Cruz-Watsonville, CA": [36.9741, -122.0308],
  "Gadsden, AL": [34.0143, -86.0066],
  "Lebanon, PA": [40.3409, -76.4113],
  "Lawton, OK": [34.6036, -98.3959],
  "Wichita Falls, TX": [33.9137, -98.4934],
  "Barnstable Town, MA": [41.7003, -70.3002],
  "Syracuse, NY": [43.0481, -76.1474],
  "Tulsa, OK": [36.154, -95.9928],
  "York-Hanover, PA": [39.9626, -76.7277],
  "Goldsboro, NC": [35.3849, -77.9928],
  "Worcester, MA": [42.2626, -71.8023],
  "Madison, WI": [43.0731, -89.4012],
  "Buffalo-Cheektowaga, NY": [42.8864, -78.8784],
  "Gainesville, GA": [34.2979, -83.8241],
  "Danville, VA": [36.586, -79.393],
  "Hilo-Kailua, HI": [19.7074, -155.0847],
  "Salisbury, MD": [38.3607, -75.5994],
  "Chico, CA": [39.7285, -121.8375],
  "Amherst Town-Northampton, MA": [42.3732, -72.5199],
  "Kalispell, MT": [48.192, -114.3168],
  "Lynchburg, VA": [37.4138, -79.1422],
  "Medford, OR": [42.3265, -122.8756],
  "Sherman-Denison, TX": [33.6357, -96.6089],
  "Decatur, IL": [39.8403, -88.9548],
  "Coeur d'Alene, ID": [47.6777, -116.7805],
  "Pottsville, PA": [40.6856, -76.1955],
  "Waco, TX": [31.5493, -97.1467],
  "Fort Wayne, IN": [41.0793, -85.1394],
  "Pittsfield, MA": [42.4501, -73.2453],
  "Urban Honolulu, HI": [21.3069, -157.8583],
  "Lansing-East Lansing, MI": [42.7325, -84.5555],
  "Pinehurst-Southern Pines, NC": [35.1955, -79.4695],
  "Las Cruces, NM": [32.3199, -106.7637],
  "Hickory-Lenoir-Morganton, NC": [35.7345, -81.3412],
  "Racine-Mount Pleasant, WI": [42.7261, -87.7829],
  "Jackson, TN": [35.6145, -88.8139],
  "Dothan, AL": [31.2232, -85.3905],
  "Concord, NH": [43.2081, -71.5376],
  "Knoxville, TN": [35.9606, -83.9207],
  "Redding, CA": [40.5865, -122.3917],
  "Youngstown-Warren, OH": [41.0998, -80.6495],
  "Boise City, ID": [43.615, -116.2023],
  "Michigan City-La Porte, IN": [41.7075, -86.895],
  "Tupelo, MS": [34.2576, -88.7034],
  "Burlington-South Burlington, VT": [44.4759, -73.2121],
  "Bloomington, IL": [40.4842, -88.9937],
  "Grand Junction, CO": [39.0639, -108.5506],
  "Ithaca, NY": [42.444, -76.5019],
  "Lake Charles, LA": [30.2266, -93.2174],
  "Portland-South Portland, ME": [43.6591, -70.2568],
  "Binghamton, NY": [42.0987, -75.918],
  "Sunbury, PA": [40.8626, -76.7944],
  "Lebanon-Claremont, NH-VT": [43.6426, -72.2517],
  "Kahului-Wailuku, HI": [20.8893, -156.4729],
  "South Bend-Mishawaka, IN-MI": [41.6764, -86.252],
  "Eureka-Arcata, CA": [40.8021, -124.1637],
  "Canton-Massillon, OH": [40.799, -81.3784],
  "Springfield, MO": [37.209, -93.2923],
  "Evansville, IN": [37.9716, -87.5711],
  "Johnson City, TN": [36.3134, -82.3535],
  "Salem, OR": [44.9429, -123.0351],
  "Lewiston-Auburn, ME": [44.1004, -70.2148],
  "Kenosha, WI": [42.5847, -87.8212],
  "Morgantown, WV": [39.6295, -79.9559],
  "Topeka, KS": [39.0473, -95.6752],
  "College Station-Bryan, TX": [30.628, -96.3344],
  "Columbia, MO": [38.9517, -92.3341],
  "Grand Rapids-Wyoming-Kentwood, MI": [42.9634, -85.6681],
  "Texarkana, TX-AR": [33.4418, -94.0477],
  "Yuma, AZ": [32.6927, -114.6277],
  "Peoria, IL": [40.6936, -89.589],
  "Bozeman, MT": [45.677, -111.0429],
  "Napa, CA": [38.2975, -122.2869],
  "Erie, PA": [42.1292, -80.0851],
  "Jackson, MI": [42.2459, -84.4013],
  "Niles, MI": [41.8298, -86.2537],
  "Albany, OR": [44.6365, -123.1059],
  "Wichita, KS": [37.6872, -97.3301],
  "Lawrence, KS": [38.9717, -95.2353],
  "Greeley, CO": [40.4233, -104.7091],
  "Athens-Clarke County, GA": [33.9519, -83.3576],
  "Mount Vernon-Anacortes, WA": [48.4201, -122.3345],
  "Yuba City, CA": [39.1404, -121.6169],
  "Davenport-Moline-Rock Island, IA-IL": [41.5236, -90.5776],
  "Charleston, WV": [38.3498, -81.6326],
  "Springfield, OH": [39.9242, -83.8088],
  "Rapid City, SD": [44.0805, -103.231],
  "Flagstaff, AZ": [35.1983, -111.6513],
  "Jonesboro, AR": [35.8423, -90.7043],
  "Sandusky, OH": [41.4489, -82.708],
  "Modesto, CA": [37.6391, -120.9969],
  "Roseburg, OR": [43.2165, -123.3417],
  "Watertown-Fort Drum, NY": [43.9748, -75.9108],
  "Manhattan, KS": [39.1836, -96.5717],
  "Janesville-Beloit, WI": [42.6828, -89.0187],
  "Billings, MT": [45.7833, -108.5007],
  "Altoona, PA": [40.5187, -78.3947],
  "Bloomington, IN": [39.1653, -86.5264],
  "Fargo, ND-MN": [46.8772, -96.7898],
  "St. George, UT": [37.0965, -113.5684],
  "Battle Creek, MI": [42.3212, -85.1797],
  "Augusta-Waterville, ME": [44.3106, -69.7795],
  "Beckley, WV": [37.7782, -81.1882],
  "Longview-Kelso, WA": [46.1382, -122.9382],
  "Massena-Ogdensburg, NY": [44.9308, -74.8899],
  "Utica-Rome, NY": [43.1009, -75.2327],
  "Lancaster, PA": [40.0379, -76.3055],
  "Johnstown, PA": [40.3267, -78.922],
  "Kingsport-Bristol, TN-VA": [36.5484, -82.5618],
  "Blacksburg-Christiansburg-Radford, VA": [37.2296, -80.4139],
  "Des Moines-West Des Moines, IA": [41.5868, -93.625],
  "Fayetteville-Springdale-Rogers, AR": [36.0626, -94.1574],
  "Ogden, UT": [41.223, -111.9738],
  "Corpus Christi, TX": [27.8006, -97.3964],
  "Cleveland, TN": [35.1595, -84.8766],
  "Houma-Bayou Cane-Thibodaux, LA": [29.5958, -90.7195],
  "Abilene, TX": [32.4487, -99.7331],
  "Muskegon-Norton Shores, MI": [43.2342, -86.2484],
  "Provo-Orem-Lehi, UT": [40.2338, -111.6585],
  "Santa Maria-Santa Barbara, CA": [34.953, -120.4357],
  "Show Low, AZ": [34.2542, -110.0298],
  "Iowa City, IA": [41.6611, -91.5302],
  "Jamestown-Dunkirk, NY": [42.097, -79.2353],
  "Lincoln, NE": [40.8136, -96.7026],
  "Cedar Rapids, IA": [42.0083, -91.6441],
  "Rochester, MN": [44.0121, -92.4802],
  "Richmond-Berea, KY": [37.7487, -84.2947],
  "San Angelo, TX": [31.4638, -100.437],
  "Bangor, ME": [44.8012, -68.7778],
  "Decatur, AL": [34.6059, -86.9833],
  "Williamsport, PA": [41.2412, -77.0011],
  "Duluth, MN-WI": [46.7867, -92.1005],
  "Saginaw, MI": [43.4195, -83.9508],
  "Joplin, MO-KS": [37.0842, -94.5133],
  "Cookeville, TN": [36.1628, -85.5016],
  "State College, PA": [40.7934, -77.86],
  "Merced, CA": [37.3022, -120.483],
  "Staunton-Stuarts Draft, VA": [38.1496, -79.0717],
  "Wheeling, WV-OH": [40.064, -80.7209],
  "Fond du Lac, WI": [43.773, -88.4471],
  "Sioux Falls, SD-MN": [43.546, -96.7313],
  "Florence-Muscle Shoals, AL": [34.7998, -87.6772],
  "Hermitage, PA": [41.2334, -80.4487],
  "Paducah, KY-IL": [37.0834, -88.6001],
  "Oshkosh-Neenah, WI": [44.0247, -88.5426],
  "Glens Falls, NY": [43.3095, -73.644],
  "Morristown, TN": [36.214, -83.2949],
  "Muncie, IN": [40.1934, -85.3864],
  "Green Bay, WI": [44.5133, -88.0133],
  "Kennewick-Richland, WA": [46.2112, -119.1372],
  "Wenatchee-East Wenatchee, WA": [47.4235, -120.3103],
  "Monroe, MI": [41.9164, -83.3977],
  "Gettysburg, PA": [39.8309, -77.2311],
  "Weirton-Steubenville, WV-OH": [40.419, -80.589],
  "Jefferson City, MO": [38.5768, -92.1735],
  "Traverse City, MI": [44.7631, -85.6206],
  "Salem, OH": [40.9009, -80.8573],
  "Appleton, WI": [44.2619, -88.4154],
  "Harrisonburg, VA": [38.4496, -78.8689],
  "Sheboygan, WI": [43.7508, -87.7145],
  "Visalia, CA": [36.3302, -119.2921],
  "Chambersburg, PA": [39.9376, -77.6611],
  "Lafayette-West Lafayette, IN": [40.4167, -86.8753],
  "St. Joseph, MO-KS": [39.7687, -94.8466],
  "Idaho Falls, ID": [43.4917, -112.0339],
  "Hanford-Corcoran, CA": [36.3274, -119.6457],
  "Whitewater-Elkhorn, WI": [42.8339, -88.7326],
  "Huntington-Ashland, WV-KY-OH": [38.4192, -82.4452],
  "Bowling Green, KY": [36.9903, -86.4436],
  "Bay City, MI": [43.5945, -83.8889],
  "Salinas, CA": [36.6777, -121.6555],
  "St. Cloud, MN": [45.5608, -94.1636],
  "Elkhart-Goshen, IN": [41.682, -85.9767],
  "Mansfield, OH": [40.7588, -82.5154],
  "La Crosse-Onalaska, WI-MN": [43.8014, -91.2396],
  "Mankato, MN": [44.1636, -93.9994],
  "Fort Smith, AR-OK": [35.3859, -94.3985],
  "Terre Haute, IN": [39.4667, -87.4139],
  "Twin Falls, ID": [42.5558, -114.4601],
  "Logan, UT-ID": [41.737, -111.8338],
  "Owensboro, KY": [37.7719, -87.1112],
  "Lima, OH": [40.7428, -84.1052],
  "Waterloo-Cedar Falls, IA": [42.4928, -92.3426],
  "Ames, IA": [42.0308, -93.6319],
  "Eau Claire, WI": [44.8113, -91.4985],
  "Sioux City, IA-NE-SD": [42.4963, -96.4049],
  "Farmington, NM": [36.7281, -108.2187],
  "Wausau, WI": [44.9591, -89.6301],
  "Wooster, OH": [40.8051, -81.9351],
  "Ottawa, IL": [41.3456, -88.8426],
  "Laredo, TX": [27.5036, -99.5076],
  "Bismarck, ND": [46.8083, -100.7837],
  "Yakima, WA": [46.6021, -120.5059],
  "Grand Forks, ND-MN": [47.9253, -97.0329],
  "Holland, MI": [42.7876, -86.1089],
  "McAllen-Edinburg-Mission, TX": [26.2034, -98.23],
  "Dalton, GA": [34.7698, -84.9702],
  "Moses Lake, WA": [47.1301, -119.278],
  "Brownsville-Harlingen, TX": [25.9017, -97.4975],
  "Corbin, KY": [36.9487, -84.0969],
  "El Centro, CA": [32.792, -115.5631],
  "San Juan-Bayamón-Caguas, PR": [18.4655, -66.1057],
  "Aguadilla, PR": [18.4274, -67.1541],
  "Mayagüez, PR": [18.2013, -67.1397],
  "Ponce, PR": [18.0111, -66.6141],
  "Arecibo, PR": [18.4725, -66.7156],
};

// ── State → [lat, lng] ─────────────────────────────────────────────────
const STATE_COORDS = {
  "Alabama": [32.806671, -86.791130],
  "Alaska": [61.370716, -152.404419],
  "Arizona": [33.729759, -111.431221],
  "Arkansas": [34.969704, -92.373123],
  "California": [36.116203, -119.681564],
  "Colorado": [39.059811, -105.311104],
  "Connecticut": [41.597782, -72.755371],
  "Delaware": [39.318523, -75.507141],
  "District of Columbia": [38.8964, -77.0262],
  "Florida": [27.766279, -81.686783],
  "Georgia": [33.040619, -83.643074],
  "Hawaii": [21.094318, -157.498337],
  "Idaho": [44.240459, -114.478828],
  "Illinois": [40.349457, -88.986137],
  "Indiana": [39.849426, -86.258278],
  "Iowa": [42.011539, -93.210526],
  "Kansas": [38.526600, -96.726486],
  "Kentucky": [37.668140, -84.670067],
  "Louisiana": [31.169546, -91.867805],
  "Maine": [44.693947, -69.381927],
  "Maryland": [39.063946, -76.802101],
  "Massachusetts": [42.230171, -71.530106],
  "Michigan": [43.326618, -84.536095],
  "Minnesota": [45.694454, -93.900192],
  "Mississippi": [32.741646, -89.678696],
  "Missouri": [38.456085, -92.288368],
  "Montana": [46.921925, -110.454353],
  "Nebraska": [41.125370, -98.268082],
  "Nevada": [38.313515, -117.055374],
  "New Hampshire": [43.452492, -71.563896],
  "New Jersey": [40.298904, -74.521011],
  "New Mexico": [34.840515, -106.248482],
  "New York": [42.165726, -74.948051],
  "North Carolina": [35.630066, -79.806419],
  "North Dakota": [47.528912, -99.784012],
  "Ohio": [40.388783, -82.764915],
  "Oklahoma": [35.565342, -96.928917],
  "Oregon": [44.572021, -122.070938],
  "Pennsylvania": [40.590752, -77.209755],
  "Puerto Rico": [18.2208, -66.5901],
  "Rhode Island": [41.680893, -71.511780],
  "South Carolina": [33.856892, -80.945007],
  "South Dakota": [44.299782, -99.438828],
  "Tennessee": [35.747845, -86.692345],
  "Texas": [31.054487, -97.563461],
  "Utah": [40.150032, -111.862434],
  "Vermont": [44.045876, -72.710686],
  "Virginia": [37.769337, -78.169968],
  "Washington": [47.400902, -121.490494],
  "West Virginia": [38.491226, -80.954453],
  "Wisconsin": [44.268543, -89.616508],
  "Wyoming": [42.755966, -107.302490],
};

// ── Helpers ─────────────────────────────────────────────────────────────

function parseNum(s) {
  if (s == null) return 0;
  return Number(String(s).replace(/[$,%"\s]/g, '')) || 0;
}

function stripSuffix(name) {
  return name
    .replace(/\s*(Metropolitan|Micropolitan)\s+Statistical\s+Area\s*$/i, '')
    .trim();
}

function readCSV(filePath) {
  const buf = fs.readFileSync(filePath);
  const raw = buf.toString('latin1');
  return Papa.parse(raw, { header: false, skipEmptyLines: true }).data;
}

// ── Process MSA-level data ──────────────────────────────────────────────

function processMSA(filename) {
  const rows = readCSV(path.join(CSV_DIR, filename));
  const headerIdx = rows.findIndex(r =>
    r.some(c => /Metropolitan Area/i.test(c))
  );
  if (headerIdx === -1) throw new Error(`No header found in ${filename}`);

  const dataRows = rows.slice(headerIdx + 1);
  const results = [];
  let unmatched = [];

  for (const row of dataRows) {
    const rank = parseNum(row[0]);
    const rawName = (row[1] || '').trim();
    if (!rawName || !rank) continue;

    const shortName = stripSuffix(rawName);
    const coords = MSA_COORDS[shortName];

    if (!coords) {
      unmatched.push(shortName);
      continue;
    }

    results.push({
      name: shortName,
      lat: coords[0],
      lng: coords[1],
      reports: parseNum(row[3]),
      perCapita: parseNum(row[2]),
      rank,
    });
  }

  if (unmatched.length > 0) {
    console.warn(`  ⚠ ${unmatched.length} MSAs without coordinates:`);
    unmatched.forEach(n => console.warn(`    - "${n}"`));
  }

  return results;
}

// ── Process state-level data ────────────────────────────────────────────

function processStates(filename) {
  const rows = readCSV(path.join(CSV_DIR, filename));
  const headerIdx = rows.findIndex(r =>
    r.some(c => /^State$/i.test(String(c).trim()))
  );
  if (headerIdx === -1) throw new Error(`No header found in ${filename}`);

  const dataRows = rows.slice(headerIdx + 1);
  const results = [];

  for (const row of dataRows) {
    const state = (row[0] || '').trim();
    if (!state || !STATE_COORDS[state]) continue;

    const coords = STATE_COORDS[state];
    results.push({
      name: state,
      lat: coords[0],
      lng: coords[1],
      reports: parseNum(row[1]),
      pctReportingLoss: parseNum(row[2]),
      totalLoss: parseNum(row[3]),
      medianLoss: parseNum(row[4]),
    });
  }

  return results;
}

// ── Main ────────────────────────────────────────────────────────────────

fs.mkdirSync(OUT_DIR, { recursive: true });

console.log('Processing MSA Fraud data...');
const msaFraud = processMSA('2024_CSN_Metropolitan_Areas_Fraud_and_Other_Reports.csv');
fs.writeFileSync(
  path.join(OUT_DIR, 'msa_fraud.json'),
  JSON.stringify(msaFraud, null, 2)
);
console.log(`  ✓ ${msaFraud.length} metros written to msa_fraud.json`);

console.log('Processing MSA Identity Theft data...');
const msaIdTheft = processMSA('2024_CSN_Metropolitan_Areas_Identity_Theft_Reports.csv');
fs.writeFileSync(
  path.join(OUT_DIR, 'msa_identity_theft.json'),
  JSON.stringify(msaIdTheft, null, 2)
);
console.log(`  ✓ ${msaIdTheft.length} metros written to msa_identity_theft.json`);

console.log('Processing State Fraud data...');
const stateFraud = processStates('2024_CSN_State_Fraud_Reports_and_Losses.csv');
fs.writeFileSync(
  path.join(OUT_DIR, 'state_fraud.json'),
  JSON.stringify(stateFraud, null, 2)
);
console.log(`  ✓ ${stateFraud.length} states written to state_fraud.json`);

console.log('\nDone!');
