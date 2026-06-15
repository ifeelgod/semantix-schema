/**
 * Intelligently maps CSV headers to Schema.org paths using fuzzy matching rules,
 * including exact matching, partial matching, label matching, and synonym lists.
 */
export const fuzzyAutoMap = (headers, schemaFields) => {
  const mapping = {};
  
  // Normalize strings for comparison
  const normalize = (str) => {
    if (!str) return '';
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
  };

  headers.forEach(header => {
    const normHeader = normalize(header);
    if (!normHeader) return;

    let bestField = null;
    let bestScore = 0; // Higher is better

    schemaFields.forEach(field => {
      const normPath = normalize(field.path);
      const parts = field.path.split('/');
      const lastPart = parts[parts.length - 1];
      const normLastPart = normalize(lastPart);
      const normLabel = normalize(field.label);

      let score = 0;

      // Rule 1: Exact match of last part of path (e.g. "price" vs "offers/price" -> lastPart is "price")
      if (normHeader === normLastPart) {
        score = 100;
      }
      // Rule 2: Exact match of label (e.g. "productname" vs "Product Name")
      else if (normHeader === normLabel) {
        score = 90;
      }
      // Rule 3: Exact match of whole path (e.g. "offersprice" vs "offers/price")
      else if (normHeader === normPath) {
        score = 80;
      }
      // Rule 4: Header contains the last part of path or vice-versa
      else if (normHeader.includes(normLastPart) && normLastPart.length > 2) {
        score = 50 + (normLastPart.length / normHeader.length) * 10;
      }
      else if (normLastPart.includes(normHeader) && normHeader.length > 2) {
        score = 50 + (normHeader.length / normLastPart.length) * 10;
      }
      // Rule 5: Label contains header or vice-versa
      else if (normLabel.includes(normHeader) && normHeader.length > 2) {
        score = 40;
      }
      // Rule 6: Synonym checks
      else {
        const synonyms = {
          sku: ['sku', 'itemcode', 'upc', 'ean', 'partnumber', 'barcode'],
          mpn: ['mpn', 'manufacturerpartnumber', 'partnum'],
          price: ['price', 'cost', 'amount', 'rate', 'msrp', 'offerprice', 'ticketprice'],
          currency: ['currency', 'curr', 'pricecurrency', 'money', 'ticketcurrency'],
          url: ['url', 'link', 'href', 'website', 'producturl', 'offersurl', 'ticketurl', 'buyurl'],
          image: ['image', 'img', 'photo', 'picture', 'thumbnail', 'banner'],
          description: ['description', 'desc', 'body', 'text', 'summary', 'about'],
          name: ['name', 'title', 'headline', 'subject', 'eventname', 'businessname', 'productname'],
          telephone: ['telephone', 'phone', 'tel', 'contact'],
          priceRange: ['pricerange', 'pricelevel', 'tier'],
          latitude: ['latitude', 'lat'],
          longitude: ['longitude', 'lon', 'lng'],
          openingHours: ['openinghours', 'hours', 'schedule'],
          streetAddress: ['streetaddress', 'street', 'addr', 'address', 'address1', 'locationstreet'],
          addressLocality: ['city', 'locality', 'town', 'locationcity'],
          addressRegion: ['state', 'region', 'prov', 'province', 'locationstate'],
          postalCode: ['postalcode', 'zip', 'zipcode', 'postcode', 'locationzip'],
          addressCountry: ['country', 'nation', 'cntry', 'locationcountry'],
          startDate: ['startdate', 'start', 'datetime', 'time', 'dateposted', 'datepublished'],
          endDate: ['enddate', 'end'],
          title: ['title', 'jobtitle', 'headline', 'name']
        };

        for (const [key, list] of Object.entries(synonyms)) {
          if (list.includes(normHeader)) {
            // Check if this field path ends with this key or contains it
            if (normLastPart === key || normLastPart.toLowerCase().includes(key)) {
              score = 70;
              break;
            }
          }
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestField = field;
      }
    });

    // If we found a match with decent score, map it
    if (bestField && bestScore > 30) {
      const currentMapping = mapping[bestField.path];
      if (!currentMapping || currentMapping.score < bestScore) {
        mapping[bestField.path] = {
          type: 'column',
          value: header,
          score: bestScore
        };
      }
    }
  });

  // Clean up score properties from final mapping objects
  const finalMapping = {};
  Object.keys(mapping).forEach(path => {
    finalMapping[path] = {
      type: mapping[path].type,
      value: mapping[path].value
    };
  });

  return finalMapping;
};
