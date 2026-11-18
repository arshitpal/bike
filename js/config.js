/* ==========================================================================
   SITE CONFIG — edit business details here.
   Anything left empty ("") shows an honest fallback on the page instead
   of invented information.
   ========================================================================== */
window.SITE_CONFIG = {
  businessName: "Diamond Automobile Service Center",

  // Phone numbers shown on the site. `tel` must include the country code.
  phones: [
    { display: "82659 81050", tel: "+918265981050" },
    { display: "95488 65050", tel: "+919548865050" }
  ],

  // Number that receives WhatsApp messages and bookings
  // (country code + number, digits only). Change it if bookings
  // should go to the second number.
  whatsapp: "918265981050",

  // Workshop street address, e.g. "Shop No. 4, Main Road, City, State 000000".
  // Leave "" until confirmed — the page will say "Call us for directions".
  address: "",

  // Opening hours, e.g. "Mon – Sat · 9:00 AM – 8:00 PM".
  // Leave "" until confirmed — the page will say "Call to confirm timings".
  hours: "",

  // Google Maps search text or "lat,lng" for the embedded map,
  // e.g. "Diamond Automobile Service Center, City" or "28.6139,77.2090".
  // Leave "" to show the map placeholder panel.
  mapQuery: ""
};
