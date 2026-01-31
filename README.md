# Landing Pages

A Bun-powered static site server for marketing landing pages with Tailwind CSS styling and subdomain-based routing.

## Features

- **Static HTML pages** with Tailwind CSS
- **Subdomain routing**: `page1.domain.com` serves `pages/page1/index.html`
- **Production security headers**: CSP, X-Frame-Options, HSTS-ready
- **Docker support** for easy deployment
- **Coolify-ready** with wildcard domain support

## Quick Start

```bash
# Install dependencies
bun install

# Build CSS
bun run build:css

# Start development server
bun run dev
```

Visit `http://localhost:3000/page1` or `http://localhost:3000/page2`

## Project Structure

```
pages/
├── page1/
│   └── index.html
├── page2/
│   └── index.html
└── [your-page]/
    └── index.html
```

Each directory under `pages/` becomes a landing page accessible via subdomain.

## Commands

| Command | Description |
|---------|-------------|
| `bun run dev` | Start dev server with hot reload |
| `bun run start` | Start production server |
| `bun run build:css` | Rebuild Tailwind CSS |

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for Docker + Coolify deployment with wildcard DNS.

---

## Using Claude to Edit Landing Pages

This project is designed to work with Claude as your AI designer. Claude will create professional, high-converting landing pages based on your prompts.

### Example Prompts

#### Creating New Pages

```
Create a new landing page for our SaaS product called "TaskFlow" -
a project management tool for remote teams. Include sections for
features, pricing (free, pro at $12/mo, enterprise), and testimonials.
```

```
Add a landing page for our mobile app "FitTrack". It's a fitness
tracking app. Use an energetic color scheme with oranges and dark
backgrounds. Include app store download buttons.
```

```
Create a "coming soon" landing page for our new product launch.
Include an email signup form and a countdown-style teaser.
```

#### Editing Existing Pages

```
Update the hero section on page1 with this new headline:
"Ship Faster, Sleep Better" and subheadline: "The deployment
platform that just works."
```

```
Change the color scheme on page2 from green/emerald to blue/indigo
tones while keeping the same layout.
```

```
Add a new testimonial to page1 from "Sarah Chen, CTO at DataCorp"
saying "Reduced our deployment time by 80%"
```

```
Replace the pricing section on page1 with a simpler two-tier model:
Free and Pro ($19/month)
```

#### Adding Sections

```
Add an FAQ section to page2 with 5 common questions about
our product's security and data handling.
```

```
Add a "How it works" section with 3 steps to page1,
placed between the hero and features sections.
```

```
Add a logo cloud section showing our integration partners:
Slack, GitHub, Jira, and Notion.
```

```
Add a comparison table to page1 showing our product vs
competitors on key features.
```

#### Styling Changes

```
Make the CTA buttons on page1 larger and more prominent.
Add a subtle animation on hover.
```

```
Add a gradient background to the hero section on page2,
going from dark blue to purple.
```

```
Improve the mobile layout on page1 - the features grid
looks cramped on smaller screens.
```

#### Content Updates

```
Rewrite all the feature descriptions on page1 to be more
benefit-focused rather than feature-focused.
```

```
Update the footer on all pages to include links to our
new blog, careers page, and status page.
```

```
Change the company name from "Product" to "Acme Inc"
across all pages.
```

#### Complete Redesigns

```
Redesign page1 with a minimalist aesthetic - lots of
whitespace, simple typography, muted colors.
```

```
Make page2 more visually dynamic with larger images,
bolder typography, and more visual hierarchy.
```

### Tips for Better Results

1. **Be specific**: Include details about colors, layout, and content
2. **Provide context**: Explain what your product does and who it's for
3. **Reference examples**: "Similar to Stripe's landing page style"
4. **Include copy**: Provide specific text you want to use
5. **Mention constraints**: "Keep it above the fold" or "Mobile-first"

### After Claude Makes Changes

Claude will:
1. Make the requested changes to HTML files
2. Run `bun run build:css` if new Tailwind classes were added
3. Start the local server with `bun run dev`
4. Provide a summary of changes made

You can then preview at `http://localhost:3000/[pagename]`

---

## License

MIT
