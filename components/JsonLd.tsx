export default function JsonLd() {
  const jsonLdData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://dailyforest.vercel.app/#organization",
        "name": "DailyForest",
        "url": "https://dailyforest.vercel.app",
        "logo": "https://dailyforest.vercel.app/icon-512.png",
        "sameAs": ["https://github.com/tanyas27/weekly-tracker"]
      },
      {
        "@type": "WebSite",
        "@id": "https://dailyforest.vercel.app/#website",
        "url": "https://dailyforest.vercel.app",
        "name": "DailyForest",
        "description": "Free Daily & Weekly Planner with Ghibli-inspired aesthetic, time blocking, and offline support.",
        "publisher": {
          "@id": "https://dailyforest.vercel.app/#organization"
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://dailyforest.vercel.app/c/{calendarId}",
          "query-input": "required name=calendarId"
        }
      },
      {
        "@type": ["SoftwareApplication", "WebApplication"],
        "@id": "https://dailyforest.vercel.app/#application",
        "name": "DailyForest",
        "url": "https://dailyforest.vercel.app",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "All modern web browsers",
        "offers": {
          "@type": "Offer",
          "price": "0.00",
          "priceCurrency": "USD"
        },
        "featureList": [
          "Time blocking daily scheduler",
          "Weekly task planning",
          "Shareable multi-tenant calendars",
          "Offline Progressive Web App (PWA)",
          "Privacy controls & passcode protection",
          "Studio Ghibli-inspired aesthetic design"
        ]
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://dailyforest.vercel.app/#breadcrumb",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://dailyforest.vercel.app"
          }
        ]
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
    />
  );
}
