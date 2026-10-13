const fs = require('fs');
const path = require('path');

// Helper to slugify strings
function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '') // Remove accents
        .replace(/[^a-z0-9\s-]/g, '')    // Remove special chars
        .trim()
        .replace(/\s+/g, '-')           // Spaces to hyphens
        .replace(/-+/g, '-');            // Double hyphens to single
}

// Read data.js file and extract catalogData manually since it's not a module
const dataJsPath = path.join(__dirname, '..', 'data.js');
const content = fs.readFileSync(dataJsPath, 'utf8');

// Basic regex to extract the array.
// This works because the file is formatted as const catalogData = [ ... ];
const match = content.match(/const\s+catalogData\s*=\s*(\[[\s\S]*?\]);/);
if (!match) {
    console.error("Could not find catalogData array in data.js");
    process.exit(1);
}

// Evaluate the array string into a JS object
// WARNING: eval is used here because we trust our own data.js.
const catalogData = eval(match[1]);

const manifest = {};
const perfumesDir = path.join(__dirname, '..', 'img', 'perfumes');

if (!fs.existsSync(perfumesDir)) {
    fs.mkdirSync(perfumesDir, { recursive: true });
}

console.log(`Analyzing ${catalogData.length} perfumes...`);

catalogData.forEach(perfume => {
    const slug = slugify(`${perfume.house} ${perfume.name}`);
    const expectedFilename = `${slug}.png`;
    const filePath = path.join(perfumesDir, expectedFilename);

    let status = 'pending';

    // Rule: Skip if already has image property AND file exists on disk
    if (perfume.image && fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
        status = 'completed';
    }

    manifest[slug] = {
        house: perfume.house,
        name: perfume.name,
        gender: perfume.gender,
        expected_filename: expectedFilename,
        status: status,
        source_url: null,
        attempts: 0,
        last_updated: null
    };
});

const manifestPath = path.join(__dirname, '..', 'img', 'perfumes_manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

const completedCount = Object.values(manifest).filter(p => p.status === 'completed').length;
console.log(`Manifest created at ${manifestPath}`);
console.log(`Total: ${catalogData.length} | Completed: ${completedCount} | Pending: ${catalogData.length - completedCount}`);
