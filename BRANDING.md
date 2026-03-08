# 🏷️ Sui Shop - Branding Summary

## Updated Branding

**Application Name:** Sui Shop  
**Powered By:** CoA Tech  
**Platform:** Sui Blockchain

---

## Design Mockup Updated ✅

The `DESIGN_MOCKUP.html` file has been updated with your new branding:

### Changes Made:
- ✅ App name changed from "Sui Shop" to **"Sui Shop"**
- ✅ "Powered by" section now shows **"CoA Tech"** (with gradient styling)
- ✅ Page title updated
- ✅ All headers and logos updated

### How to View:
Simply open `DESIGN_MOCKUP.html` in any web browser to see:
1. **Landing Page** - Shows "Sui Shop" with "Powered by CoA Tech"
2. **Marketplace** - Header displays "Sui Shop"
3. **List Product Modal** - Consistent branding throughout

---

## Files to Update in Your Project

When you're ready to deploy, update these files with your branding:

### Frontend Files:
```
frontend/src/pages/index.tsx
  - Line 17: Change "Sui Shop" to "Sui Shop"
  - Line 45: Update "Powered by" section to "CoA Tech"

frontend/src/components/MarketplacePage.tsx
  - Line 22: Update app name to "Sui Shop"
  
frontend/package.json
  - Line 2: Update "name" field
```

### Documentation Files:
```
README.md
  - Title and throughout
  
GETTING_STARTED.md
  - Title and references
  
All files in docs/ folder
  - Update app name references
```

### Smart Contract:
```
move/marketplace.move
  - Module comments (optional)
```

---

## Quick Find & Replace

Use these commands to update all files at once:

```bash
# Update in all .tsx and .ts files
find frontend/src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i 's/Sui Shop/Sui Shop/g' {} +

# Update in documentation
find . -type f -name "*.md" -exec sed -i 's/Sui Shop/Sui Shop/g' {} +

# Update "Powered by" references
find . -type f \( -name "*.tsx" -o -name "*.md" \) -exec sed -i 's/Sui Network/CoA Tech/g' {} +
```

**Note:** Review changes before committing to ensure context is preserved!

---

## Branding Consistency Checklist

When deploying your marketplace:

- [ ] Update app name in all frontend components
- [ ] Update package.json name field
- [ ] Update README.md and documentation
- [ ] Update meta tags and SEO
- [ ] Update favicon (create branded icon)
- [ ] Update social media preview images
- [ ] Update any API naming conventions
- [ ] Update smart contract comments (optional)
- [ ] Test all UI elements show correct branding

---

## Design Assets Needed

For production, you'll want to create:

1. **Logo Files:**
   - SVG logo for "Sui Shop"
   - Favicon (16x16, 32x32, 180x180)
   - Social media preview image (1200x630)

2. **Brand Colors (Current):**
   - Primary Gradient: #8b5cf6 → #d946ef (Purple to Pink)
   - Background: Dark gradient (#020617 → #1e1b4b)
   - Accent: Emerald (#10b981) for success states

3. **Typography:**
   - Primary: System fonts (San Francisco, Segoe UI)
   - Headers: Bold, tight letter-spacing
   - Body: Regular weight, good readability

---

## CoA Tech Branding

"CoA Tech" appears in the landing page footer as:
- **Visual Style:** Gradient text (purple to pink)
- **Size:** 18px, bold (700 weight)
- **Position:** Below feature cards
- **Label:** "Powered by"

This positioning establishes your brand identity while maintaining the product focus.

---

**Last Updated:** February 2026  
**Status:** Design mockup updated ✅  
**Next Step:** Update source code files when ready to deploy

---

### Quick Start with New Branding

1. Open `DESIGN_MOCKUP.html` - See your new branding immediately!
2. Use find & replace commands above when ready to update source
3. Deploy with pride under the CoA Tech banner! 🚀
