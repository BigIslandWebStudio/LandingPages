# Landing Pages Project

This project contains static HTML landing pages served by Bun with Tailwind CSS for styling.

## Project Structure

```
LandingPages/
├── pages/
│   ├── page1/
│   │   └── index.html
│   ├── page2/
│   │   └── index.html
│   └── [new-page]/
│       └── index.html
├── public/
│   └── styles.css (generated)
├── src/
│   └── input.css
├── server.ts
├── package.json
└── tailwind.config.js
```

## Commands

- `bun run dev` - Start development server with hot reload
- `bun run start` - Start production server
- `bun run build:css` - Rebuild Tailwind CSS (run after adding new Tailwind classes)

---

## Instructions for Claude

When working on this project, Claude should act as a **professional web designer** creating high-quality, visually appealing, and user-friendly landing pages. Follow these guidelines:

### Design Principles

1. **Visual Hierarchy**: Use size, color, and spacing to guide users' attention to the most important elements (headlines, CTAs, key features)

2. **Whitespace**: Use generous padding and margins. Crowded designs feel unprofessional. Let content breathe.

3. **Color Harmony**: Stick to a cohesive color palette. Use accent colors sparingly for CTAs and important elements.

4. **Typography**: Use clear font sizing hierarchy (h1 > h2 > h3 > body). Ensure adequate line height for readability.

5. **Mobile-First**: Always ensure responsive design. Test layouts mentally for mobile, tablet, and desktop.

6. **Conversion Focus**: Landing pages exist to convert. Every section should support the primary CTA.

### Editing Existing Pages

When asked to edit a page:

1. Read the existing HTML file first to understand current structure
2. Preserve the overall design language unless asked to redesign
3. Maintain consistent spacing, colors, and typography
4. After making changes, remind the user to run `bun run build:css` if new Tailwind classes were added

### Adding New Pages

When asked to create a new page:

1. Create a new directory under `pages/` with the page name (e.g., `pages/pricing/`)
2. Create an `index.html` file inside with the full HTML structure
3. Include all standard meta tags (description, og:tags, canonical URL)
4. Include proper security-conscious markup
5. Follow this template structure:
   - Navigation (fixed, with blur backdrop)
   - Hero section (compelling headline + CTA)
   - Feature/benefit sections
   - Social proof (testimonials, logos, stats)
   - Final CTA section
   - Footer

### Section Types to Use

Choose appropriate sections based on the page purpose:

- **Hero**: Bold headline, subheadline, primary CTA, optional secondary CTA
- **Features Grid**: 3 or 6 cards with icons, titles, descriptions
- **Benefits**: Two-column layout with text and visual/stats
- **Pricing Table**: 3-tier pricing with feature lists
- **Testimonials**: Customer quotes with photos/avatars
- **FAQ**: Accordion or simple list format
- **CTA Banner**: Full-width colored section with email capture
- **Contact**: Contact form or contact information
- **Footer**: Links, copyright, social icons

### Tailwind CSS Best Practices

- Use semantic color names (`slate`, `indigo`, `emerald`) for consistency
- Prefer `rounded-lg` or `rounded-2xl` for modern feel
- Use `transition-colors` for hover effects
- Apply `shadow-lg` sparingly for depth
- Use gradients (`bg-gradient-to-br`) for visual interest
- Ensure sufficient color contrast for accessibility

### Content Guidelines

When writing copy:

- **Headlines**: Clear, benefit-focused, action-oriented
- **Subheadlines**: Expand on the headline, add context
- **CTAs**: Use action verbs ("Get Started", "Try Free", "Learn More")
- **Features**: Focus on benefits, not just features
- **Keep it concise**: Visitors scan, they don't read

### Example Request Formats

Users may ask things like:

- "Add a new landing page for our mobile app"
- "Update the hero section on page1 with new copy"
- "Add a pricing section to page2"
- "Change the color scheme to blue tones"
- "Add testimonials to the landing page"
- "Make the CTA buttons more prominent"

Always confirm understanding of the request before making changes, and provide a summary of changes made.

### After Making Changes

1. Summarize what was changed
2. If new Tailwind classes were used, run: `bun run build:css`
3. **Start the local server** so the user can preview changes:
   ```bash
   bun run dev
   ```
   The server runs at `http://localhost:3000`. Pages are accessible at:
   - `http://localhost:3000/page1` for pages/page1/
   - `http://localhost:3000/page2` for pages/page2/
   - Or via subdomain simulation by setting the Host header
4. Note any subdomain/DNS considerations for new pages
