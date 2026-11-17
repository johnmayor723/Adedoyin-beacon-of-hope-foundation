// Declarative field schemas. They drive BOTH the admin forms and the server-side
// validation/whitelisting of what an editor may save.
//
// field: { key, label, type, help?, options?, fields?, itemLabel?, max? }
// types: text | textarea | url | image | bool | select | number | color | list | group

const ICONS = ['heart', 'book', 'sun', 'shield', 'users', 'home', 'star', 'leaf', 'hand', 'health'];

const seo = {
  key: 'seo', label: 'Search engine (SEO)', type: 'group', fields: [
    { key: 'title', label: 'Page title', type: 'text' },
    { key: 'description', label: 'Meta description', type: 'textarea' },
  ],
};

const banner = (def = {}) => ({
  key: 'banner', label: 'Page header banner', type: 'group', fields: [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
    { key: 'image', label: 'Background image', type: 'image' },
  ],
});

const pages = {
  home: {
    label: 'Home', url: '/',
    fields: [
      {
        key: 'hero', label: 'Hero section', type: 'group', fields: [
          { key: 'badge', label: 'Small badge text', type: 'text' },
          { key: 'title', label: 'Headline', type: 'text' },
          { key: 'subtitle', label: 'Sub-headline', type: 'textarea' },
          { key: 'image', label: 'Hero image', type: 'image', help: 'Portrait or landscape both work; it is shown in an arch frame.' },
          { key: 'primaryLabel', label: 'Primary button label', type: 'text' },
          { key: 'primaryLink', label: 'Primary button link', type: 'url' },
          { key: 'secondaryLabel', label: 'Secondary button label', type: 'text' },
          { key: 'secondaryLink', label: 'Secondary button link', type: 'url' },
        ],
      },
      {
        key: 'mission', label: 'Mission section', type: 'group', fields: [
          { key: 'visible', label: 'Show this section', type: 'bool' },
          { key: 'eyebrow', label: 'Eyebrow (small label)', type: 'text' },
          { key: 'title', label: 'Heading', type: 'text' },
          { key: 'intro', label: 'Intro text', type: 'textarea' },
          {
            key: 'items', label: 'Mission items', type: 'list', itemLabel: 'title', fields: [
              { key: 'icon', label: 'Icon', type: 'select', options: ICONS },
              { key: 'title', label: 'Title', type: 'text' },
              { key: 'text', label: 'Text', type: 'textarea' },
            ],
          },
        ],
      },
      {
        key: 'programs', label: 'Programs section', type: 'group', fields: [
          { key: 'visible', label: 'Show this section', type: 'bool' },
          { key: 'eyebrow', label: 'Eyebrow (small label)', type: 'text' },
          { key: 'title', label: 'Heading', type: 'text' },
          { key: 'intro', label: 'Intro text', type: 'textarea' },
          { key: 'limit', label: 'How many featured programs to show', type: 'number' },
          { key: 'buttonLabel', label: '"View all" button label', type: 'text' },
        ],
      },
      {
        key: 'cta', label: 'Subscribe banner', type: 'group', fields: [
          { key: 'visible', label: 'Show this section', type: 'bool' },
          { key: 'title', label: 'Heading', type: 'text' },
          { key: 'text', label: 'Text', type: 'textarea' },
          { key: 'image', label: 'Background image', type: 'image' },
          { key: 'buttonLabel', label: 'Button label', type: 'text' },
          { key: 'success', label: 'Success message', type: 'text' },
        ],
      },
      seo,
    ],
  },
  about: {
    label: 'About Us', url: '/about-us',
    fields: [
      banner(),
      {
        key: 'story', label: 'Our story', type: 'group', fields: [
          { key: 'title', label: 'Heading', type: 'text' },
          { key: 'paragraphs', label: 'Text', type: 'textarea', rows: 12, help: 'Separate paragraphs with a blank line.' },
          { key: 'image', label: 'Image', type: 'image' },
        ],
      },
      {
        key: 'mission', label: 'Mission section', type: 'group', fields: [
          { key: 'visible', label: 'Show this section', type: 'bool' },
          { key: 'title', label: 'Heading', type: 'text' },
          { key: 'intro', label: 'Intro text', type: 'textarea' },
          {
            key: 'items', label: 'Mission items', type: 'list', itemLabel: 'title', fields: [
              { key: 'icon', label: 'Icon', type: 'select', options: ICONS },
              { key: 'title', label: 'Title', type: 'text' },
              { key: 'text', label: 'Text', type: 'textarea' },
            ],
          },
        ],
      },
      {
        key: 'team', label: 'Team section', type: 'group', fields: [
          { key: 'visible', label: 'Show this section', type: 'bool' },
          { key: 'title', label: 'Heading', type: 'text' },
          { key: 'intro', label: 'Intro text', type: 'textarea' },
          {
            key: 'members', label: 'Team members', type: 'list', itemLabel: 'name', fields: [
              { key: 'name', label: 'Name', type: 'text' },
              { key: 'role', label: 'Role', type: 'text' },
              { key: 'photo', label: 'Photo', type: 'image' },
              { key: 'bio', label: 'Short bio', type: 'textarea' },
            ],
          },
        ],
      },
      seo,
    ],
  },
  programs: {
    label: 'Programs page', url: '/programs',
    fields: [
      banner(),
      {
        key: 'intro', label: 'Intro', type: 'group', fields: [
          { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
          { key: 'title', label: 'Heading', type: 'text' },
          { key: 'text', label: 'Text', type: 'textarea' },
        ],
      },
      seo,
    ],
  },
  gallery: {
    label: 'Gallery page', url: '/gallery',
    fields: [
      banner(),
      {
        key: 'intro', label: 'Intro', type: 'group', fields: [
          { key: 'title', label: 'Heading', type: 'text' },
          { key: 'text', label: 'Text', type: 'textarea' },
        ],
      },
      seo,
    ],
  },
  contact: {
    label: 'Contact page', url: '/contact',
    fields: [
      banner(),
      {
        key: 'intro', label: 'Intro', type: 'group', fields: [
          { key: 'title', label: 'Heading', type: 'text' },
          { key: 'text', label: 'Text', type: 'textarea' },
        ],
      },
      {
        key: 'form', label: 'Contact form', type: 'group', fields: [
          { key: 'title', label: 'Form heading', type: 'text' },
          { key: 'buttonLabel', label: 'Button label', type: 'text' },
          { key: 'success', label: 'Success message', type: 'text' },
        ],
      },
      seo,
    ],
  },
  donate: {
    label: 'Donate page', url: '/donate',
    fields: [
      banner(),
      {
        key: 'intro', label: 'Intro', type: 'group', fields: [
          { key: 'title', label: 'Heading', type: 'text' },
          { key: 'text', label: 'Text', type: 'textarea' },
        ],
      },
      {
        key: 'bank', label: 'Bank deposit details', type: 'group', fields: [
          { key: 'title', label: 'Heading', type: 'text' },
          {
            key: 'details', label: 'Details', type: 'list', itemLabel: 'label', fields: [
              { key: 'label', label: 'Label', type: 'text' },
              { key: 'value', label: 'Value', type: 'text' },
            ],
          },
          { key: 'note', label: 'Note under details', type: 'textarea' },
        ],
      },
      seo,
    ],
  },
};

const linkList = (key, label) => ({
  key, label, type: 'list', itemLabel: 'label', fields: [
    { key: 'label', label: 'Label', type: 'text' },
    { key: 'url', label: 'Link (e.g. /about-us or https://...)', type: 'url' },
    { key: 'visible', label: 'Visible', type: 'bool' },
  ],
});

// Global settings are split into tabs. Each tab saves into settings.data.
const settingsGroups = {
  identity: {
    label: 'Identity & logo',
    fields: [
      { key: 'siteName', label: 'Organisation name', type: 'text' },
      { key: 'tagline', label: 'Tagline', type: 'text' },
      { key: 'logo', label: 'Logo', type: 'image' },
      { key: 'favicon', label: 'Favicon', type: 'image' },
      { key: 'navButtonLabel', label: 'Navbar button label', type: 'text', help: 'Leave blank to hide the button.' },
      { key: 'navButtonLink', label: 'Navbar button link', type: 'url' },
    ],
  },
  contact: {
    label: 'Contact details',
    fields: [
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'email', label: 'Public email', type: 'text' },
      { key: 'address', label: 'Address', type: 'textarea' },
      { key: 'notifyEmail', label: 'Send contact-form messages to', type: 'text', help: 'Requires MAIL_USER / MAIL_PASS in .env. Messages are always saved in the dashboard.' },
    ],
  },
  navigation: {
    label: 'Navbar links',
    fields: [linkList('headerLinks', 'Navbar links (drag order with the arrows)')],
  },
  footer: {
    label: 'Footer',
    fields: [
      { key: 'footerAbout', label: 'Footer blurb', type: 'textarea' },
      linkList('footerLinks', 'Footer links'),
      {
        key: 'socials', label: 'Social links', type: 'list', itemLabel: 'platform', fields: [
          { key: 'platform', label: 'Platform', type: 'select', options: ['facebook', 'instagram', 'twitter', 'youtube', 'linkedin', 'tiktok', 'whatsapp'] },
          { key: 'url', label: 'URL', type: 'url' },
        ],
      },
      { key: 'copyright', label: 'Copyright text', type: 'text', help: 'Year is added automatically.' },
      { key: 'creditText', label: 'Credit text', type: 'text' },
      { key: 'creditName', label: 'Credit name', type: 'text' },
      { key: 'creditLink', label: 'Credit link', type: 'url' },
    ],
  },
  theme: {
    label: 'Colours',
    fields: [
      { key: 'colorPrimary', label: 'Primary (deep green)', type: 'color' },
      { key: 'colorAccent', label: 'Accent (lime)', type: 'color' },
      { key: 'colorWarm', label: 'Warm (orange)', type: 'color' },
      { key: 'colorInk', label: 'Dark text / footer', type: 'color' },
    ],
  },
};

const programFields = [
  { key: 'title', label: 'Title', type: 'text', required: true },
  { key: 'slug', label: 'URL slug', type: 'text', help: 'Leave blank to generate from the title.' },
  { key: 'summary', label: 'Short summary (shown on cards)', type: 'textarea' },
  { key: 'cardImage', label: 'Card image', type: 'image' },
  { key: 'heroImage', label: 'Header image (detail page)', type: 'image' },
  { key: 'heroTitle', label: 'Header title (defaults to title)', type: 'text' },
  { key: 'heroSubtitle', label: 'Header subtitle', type: 'textarea' },
  { key: 'body', label: 'Main text', type: 'textarea', rows: 10, help: 'Separate paragraphs with a blank line.' },
  {
    key: 'sections', label: 'Extra sections (heading, text, image)', type: 'list', itemLabel: 'heading', fields: [
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'text', label: 'Text', type: 'textarea' },
      { key: 'image', label: 'Image', type: 'image' },
    ],
  },
  {
    key: 'gallery', label: 'Photo gallery', type: 'list', itemLabel: 'caption', fields: [
      { key: 'image', label: 'Image', type: 'image' },
      { key: 'caption', label: 'Caption', type: 'text' },
    ],
  },
  { key: 'showProgress', label: 'Show fundraising progress', type: 'bool' },
  { key: 'currency', label: 'Currency symbol', type: 'text' },
  { key: 'raised', label: 'Amount raised', type: 'number' },
  { key: 'goal', label: 'Goal', type: 'number' },
  { key: 'ctaLabel', label: 'Button label', type: 'text' },
  { key: 'ctaLink', label: 'Button link', type: 'url' },
  { key: 'order', label: 'Sort order (lower first)', type: 'number' },
  { key: 'featured', label: 'Feature on home page', type: 'bool' },
  { key: 'published', label: 'Published', type: 'bool' },
  { key: 'seoDescription', label: 'SEO description', type: 'textarea' },
];

module.exports = { pages, settingsGroups, programFields, ICONS };
