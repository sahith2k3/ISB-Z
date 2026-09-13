import os
import json
import zipfile
import collections
import xml.etree.ElementTree as ET
from PIL import Image, ImageDraw, ImageFont

# 1. Load Courses metadata
courses_map = {}
with open('data/courses.json', 'r', encoding='utf-8') as f:
    for c in json.load(f):
        code = c.get('code', '').upper().strip()
        name = c.get('name', '').strip()
        courses_map[code] = name

# Also create reverse map from lower name to code
name_to_code = {}
for code, name in courses_map.items():
    name_to_code[name.lower().strip()] = code

# 2. Parse Rosters from Excel files
def parse_rosters():
    roster = collections.defaultdict(list)
    files = [
        r'attached_assets\Term_4_Final_Class_List_Hyderabad_1788967724200.xlsx',
        r'attached_assets\Term_4_Final_Class_List_Mohali_1788967724200.xlsx',
    ]
    for xlsx_path in files:
        if not os.path.exists(xlsx_path):
            continue
        with zipfile.ZipFile(xlsx_path, 'r') as z:
            strings = []
            if 'xl/sharedStrings.xml' in z.namelist():
                tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
                for si in tree.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si'):
                    t = si.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t')
                    strings.append(t.text if t is not None else '')
            
            sheet_tree = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
            rows = sheet_tree.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}sheetData/{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row')
            
            for r in rows[4:]:
                vals = []
                for c in r.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
                    t = c.get('t')
                    v = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
                    if v is not None and v.text is not None:
                        if t == 's':
                            vals.append(strings[int(v.text)])
                        else:
                            vals.append(v.text)
                    else:
                        vals.append('')
                if len(vals) >= 4:
                    cname = vals[0].strip()
                    sec = vals[1].strip().upper()
                    sname = vals[3].strip() if len(vals) > 3 else ''
                    if cname and sec and sname:
                        code = name_to_code.get(cname.lower())
                        if not code:
                            # Fuzzy lookup
                            for full_name, c_code in name_to_code.items():
                                if cname.lower() in full_name or full_name in cname.lower():
                                    code = c_code
                                    break
                        if code:
                            roster[(code, sec)].append(sname)
    return roster

roster_data = parse_rosters()
print(f"Loaded roster data for {len(roster_data)} course-section pairs.")

# 3. Load all scheduled pairs from sessions.json
with open('data/sessions.json', 'r', encoding='utf-8-sig') as f:
    sessions = json.load(f)

all_pairs = set()
for s in sessions:
    c = s.get('courseCode')
    sec = s.get('section')
    if c and sec:
        all_pairs.add((c.upper().strip(), sec.upper().strip()))

sorted_pairs = sorted(list(all_pairs))
print(f"Total pairs to generate: {len(sorted_pairs)}")

# 4. Seat Geometry (Tiered 3-Block Lecture Theatre)
# Rows A (front) to F (back)
ROWS_CONFIG = [
    # (row_letter, left_count, center_count, right_count, y_pos)
    ('A', 2, 6, 2, 275), # 10 seats
    ('B', 3, 6, 3, 395), # 12 seats
    ('C', 3, 6, 3, 515), # 12 seats
    ('D', 4, 6, 4, 635), # 14 seats
    ('E', 4, 6, 4, 755), # 14 seats
    ('F', 4, 6, 4, 875), # 14 seats
]
# Total seats = 76

DESK_W = 80
DESK_H = 65
SPACING_X = 92

def build_seats_grid():
    seats = []
    for row_letter, l_count, c_count, r_count, y in ROWS_CONFIG:
        row_seats = []
        # Left wing (growing outward to left from Left Aisle at X=470)
        for i in range(l_count):
            # Left wing index 0 is closest to outer left, index l_count-1 is closest to aisle
            x = 470 - (l_count - i) * SPACING_X + (SPACING_X - DESK_W)
            row_seats.append((x, y))
        
        # Center section (6 desks centered around X=800)
        for i in range(c_count):
            x = 800 - 2.5 * SPACING_X + i * SPACING_X - (DESK_W / 2)
            row_seats.append((x, y))
        
        # Right wing (starting at Right Aisle X=1130, growing rightwards)
        for i in range(r_count):
            x = 1130 + i * SPACING_X
            row_seats.append((x, y))
            
        # Number the seats in this row
        for idx, (x, y_p) in enumerate(row_seats, 1):
            seat_id = f"{row_letter}-{idx:02d}"
            seats.append((seat_id, int(x), int(y_p)))
    return seats

ALL_SEATS = build_seats_grid()
print(f"Generated {len(ALL_SEATS)} seat coordinates.")

# Load Fonts
try:
    f_inst = ImageFont.truetype(r'C:\Windows\Fonts\segoeui.ttf', 16)
    f_title = ImageFont.truetype(r'C:\Windows\Fonts\segoeuib.ttf', 30)
    f_badge = ImageFont.truetype(r'C:\Windows\Fonts\segoeuib.ttf', 24)
    f_sub = ImageFont.truetype(r'C:\Windows\Fonts\segoeui.ttf', 15)
    f_seat_id = ImageFont.truetype(r'C:\Windows\Fonts\segoeuib.ttf', 13)
    f_name = ImageFont.truetype(r'C:\Windows\Fonts\segoeuib.ttf', 11)
    f_name_sub = ImageFont.truetype(r'C:\Windows\Fonts\segoeui.ttf', 11)
    f_podium = ImageFont.truetype(r'C:\Windows\Fonts\segoeuib.ttf', 14)
    f_aisle = ImageFont.truetype(r'C:\Windows\Fonts\segoeuib.ttf', 12)
except:
    f_inst = f_title = f_badge = f_sub = f_seat_id = f_name = f_name_sub = f_podium = f_aisle = ImageFont.load_default()

# Target Output Directories
output_dirs = [
    os.path.join(os.getcwd(), 'attached_assets'),
    os.path.join(os.getcwd(), 'public', 'seating'),
]
for d in output_dirs:
    os.makedirs(d, exist_ok=True)

# Generate Chart for each (courseCode, section)
for course_code, section in sorted_pairs:
    campus = "Mohali" if section in ["G", "H", "I", "J", "K", "L", "M"] else "Hyderabad"
    course_name = courses_map.get(course_code, course_code)
    students = roster_data.get((course_code, section), [])
    
    img = Image.new('RGB', (1600, 1080), color='#FFFFFF')
    draw = ImageDraw.Draw(img)
    
    # 1. Header Bar
    draw.rectangle([0, 0, 1600, 130], fill='#0F172A')
    draw.text((40, 20), 'INDIAN SCHOOL OF BUSINESS  ·  CLASSROOM SEATING ARRANGEMENT', fill='#94A3B8', font=f_inst)
    
    # Title (truncate if very long)
    title_text = f"{course_code}  ·  {course_name}"
    if len(title_text) > 46:
        title_text = title_text[:43] + "..."
    draw.text((40, 52), title_text, fill='#FFFFFF', font=f_title)
    
    # Right campus & section badge
    draw.text((1200, 42), f"Section {section} · {campus}", fill='#38BDF8', font=f_badge)
    draw.text((1200, 80), f"Term 4 (2026-27) · Lecture Theatre", fill='#94A3B8', font=f_sub)
    
    # 2. Stage / Board Area
    # Whiteboard
    draw.rectangle([500, 145, 1100, 170], fill='#334155', outline='#1E293B', width=2)
    draw.text((690, 149), 'WHITEBOARD & PROJECTION SCREEN', fill='#FFFFFF', font=f_sub)
    
    # Instructor Podium
    draw.rounded_rectangle([660, 188, 940, 230], radius=8, fill='#1E293B', outline='#0F172A', width=2)
    draw.text((720, 200), 'INSTRUCTOR PODIUM', fill='#F8FAFC', font=f_podium)
    
    # Left & Right Aisles markings
    draw.text((500, 560), 'A I S L E', fill='#CBD5E1', font=f_aisle)
    draw.text((1055, 560), 'A I S L E', fill='#CBD5E1', font=f_aisle)
    
    # Doors
    draw.rectangle([40, 960, 160, 995], fill='#F1F5F9', outline='#94A3B8', width=2)
    draw.text((55, 970), '← EXIT / ENTRY', fill='#475569', font=f_sub)
    
    draw.rectangle([1440, 960, 1560, 995], fill='#F1F5F9', outline='#94A3B8', width=2)
    draw.text((1455, 970), 'ENTRY / EXIT →', fill='#475569', font=f_sub)
    
    # 3. Draw Desks and Students
    for idx, (seat_id, x, y) in enumerate(ALL_SEATS):
        has_student = idx < len(students)
        student_name = students[idx] if has_student else None
        
        # Outer desk box
        box = [x, y, x + DESK_W, y + DESK_H]
        if has_student:
            draw.rounded_rectangle(box, radius=6, fill='#F8FAFC', outline='#2563EB', width=2)
            # Top banner for seat ID
            draw.rounded_rectangle([x, y, x + DESK_W, y + 22], radius=4, fill='#2563EB')
            draw.rectangle([x, y + 16, x + DESK_W, y + 22], fill='#2563EB') # square bottom corners
            seat_w = draw.textlength(seat_id, font=f_seat_id)
            draw.text((x + (DESK_W - seat_w) / 2, y + 4), seat_id, fill='#FFFFFF', font=f_seat_id)
            
            # Split name into first and last
            parts = student_name.split()
            first = parts[0] if len(parts) > 0 else ''
            last = " ".join(parts[1:]) if len(parts) > 1 else ''
            
            if len(first) > 10:
                first = first[:9] + ".."
            if len(last) > 11:
                last = last[:10] + ".."
                
            first_w = draw.textlength(first, font=f_name)
            last_w = draw.textlength(last, font=f_name_sub)
            draw.text((x + (DESK_W - first_w) / 2, y + 27), first, fill='#0F172A', font=f_name)
            draw.text((x + (DESK_W - last_w) / 2, y + 43), last, fill='#64748B', font=f_name_sub)
        else:
            draw.rounded_rectangle(box, radius=6, fill='#FFFFFF', outline='#E2E8F0', width=1)
            draw.rounded_rectangle([x, y, x + DESK_W, y + 20], radius=4, fill='#F1F5F9')
            seat_w = draw.textlength(seat_id, font=f_seat_id)
            draw.text((x + (DESK_W - seat_w) / 2, y + 3), seat_id, fill='#94A3B8', font=f_seat_id)
            open_w = draw.textlength('Open', font=f_name_sub)
            draw.text((x + (DESK_W - open_w) / 2, y + 34), 'Open', fill='#CBD5E1', font=f_name_sub)
            
    # 4. Footer
    draw.rectangle([0, 1020, 1600, 1080], fill='#F8FAFC', outline='#E2E8F0', width=1)
    enrolled_str = f"Enrolled: {len(students)} Students" if students else "Official Classroom Layout"
    draw.text((40, 1038), f"ISB PGP 2026-27  ·  Term 4 Seating Chart  ·  Capacity: 76 Seats  ·  {enrolled_str}", fill='#64748B', font=f_sub)
    draw.text((1280, 1038), f"Academic Planning & Administration", fill='#94A3B8', font=f_sub)
    
    # 5. Save with exact requested names
    # Primary requested filename format: CourseCode_Sec_Section.jpg
    filename_sec = f"{course_code}_Sec_{section}.jpg"
    # Secondary filename format: CourseCode_Section.jpg
    filename_simple = f"{course_code}_{section}.jpg"
    
    # Save to attached_assets
    img.save(os.path.join(output_dirs[0], filename_sec), quality=92)
    # Save to public/seating
    img.save(os.path.join(output_dirs[1], filename_sec), quality=92)
    img.save(os.path.join(output_dirs[1], filename_simple), quality=92)

print(f"Successfully generated all {len(sorted_pairs)} seating chart JPG files in attached_assets and public/seating!")
