// Helper to set nested properties and inject @types dynamically
const setNestedProperty = (obj, path, value) => {
  if (value === undefined || value === null || value === '') return;

  const parts = path.split('/');
  let current = obj;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    if (i === parts.length - 1) {
      // Last part of the path: assign the value
      current[part] = value;
    } else {
      // Intermediate path: create object if it doesn't exist and inject @type where appropriate
      if (!current[part]) {
        current[part] = {};
        
        // Inject semantic @type based on path key
        if (part === 'address') {
          current[part]['@type'] = 'PostalAddress';
        } else if (part === 'geo') {
          current[part]['@type'] = 'GeoCoordinates';
        } else if (part === 'offers') {
          current[part]['@type'] = 'Offer';
        } else if (part === 'aggregateRating') {
          current[part]['@type'] = 'AggregateRating';
        } else if (part === 'brand') {
          current[part]['@type'] = 'Brand';
        } else if (part === 'author') {
          current[part]['@type'] = 'Person'; // Default to Person, can be overridden
        } else if (part === 'publisher') {
          current[part]['@type'] = 'Organization';
        } else if (part === 'hiringOrganization') {
          current[part]['@type'] = 'Organization';
        } else if (part === 'jobLocation') {
          current[part]['@type'] = 'Place';
        } else if (part === 'location') {
          current[part]['@type'] = 'Place';
        } else if (part === 'baseSalary') {
          current[part]['@type'] = 'MonetaryAmount';
        }
      }
      current = current[part];
    }
  }
};

const sanitizeValue = (path, val) => {
  if (val === undefined || val === null || val === '') return '';

  const cleanPath = path.toLowerCase();

  // 1. Price Sanitization (for offers/price, baseSalary/value)
  if (cleanPath.endsWith('price') || (cleanPath.endsWith('value') && cleanPath.includes('salary'))) {
    const stringVal = String(val);
    // Remove symbols ($, €, £, ¥, etc.) and commas (e.g. "$1,299.99" -> "1299.99")
    const cleaned = stringVal.replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? val : parsed;
  }

  // 2. Date Sanitization (priceValidUntil, startDate, endDate, datePosted, validThrough, datePublished, dateModified)
  const dateKeywords = ['date', 'validthrough', 'validuntil', 'published', 'modified'];
  const isDateField = dateKeywords.some(keyword => cleanPath.includes(keyword));

  if (isDateField) {
    const stringVal = String(val).trim();
    
    // Parse common patterns:
    // Format 1: MM/DD/YYYY or M/D/YY (e.g. 06/14/2026 or 6/14/26)
    const slashesRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/;
    const slashesMatch = stringVal.match(slashesRegex);
    if (slashesMatch) {
      let [_, month, day, year] = slashesMatch;
      if (year.length === 2) {
        year = '20' + year; // assume 21st century
      }
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // Format 2: DD-MM-YYYY or D-M-YY (e.g. 14-06-2026)
    const dashesRegex = /^(\d{1,2})-(\d{1,2})-(\d{2,4})$/;
    const dashesMatch = stringVal.match(dashesRegex);
    if (dashesMatch) {
      let [_, day, month, year] = dashesMatch;
      if (year.length === 2) {
        year = '20' + year;
      }
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // Format 3: YYYY/MM/DD (e.g. 2026/06/14)
    const revSlashesRegex = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/;
    const revSlashesMatch = stringVal.match(revSlashesRegex);
    if (revSlashesMatch) {
      const [_, year, month, day] = revSlashesMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // Attempt native JS date parsing fallback
    const parsedDate = Date.parse(stringVal);
    if (!isNaN(parsedDate)) {
      const d = new Date(parsedDate);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }

  return val;
};

/**
 * Compiles a single CSV row into a Schema.org JSON-LD object.
 */
export const compileRow = (row, mapping, schemaType, globalConfig = {}) => {
  const result = {
    '@context': 'https://schema.org',
    '@type': schemaType,
  };

  // Special handling for FAQPage
  if (schemaType === 'FAQPage') {
    const mainEntity = [];
    
    // Check up to 4 FAQs
    for (let i = 1; i <= 4; i++) {
      const qMap = mapping[`faq_${i}/question`];
      const aMap = mapping[`faq_${i}/answer`];
      
      const qVal = sanitizeValue(`faq_${i}/question`, getValue(row, qMap));
      const aVal = sanitizeValue(`faq_${i}/answer`, getValue(row, aMap));

      if (qVal && aVal) {
        mainEntity.push({
          '@type': 'Question',
          'name': qVal,
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': aVal
          }
        });
      }
    }
    
    if (mainEntity.length > 0) {
      result.mainEntity = mainEntity;
    }
    return result;
  }

  // Iterate over mapping keys
  Object.keys(mapping).forEach(path => {
    const mapConfig = mapping[path];
    let val = getValue(row, mapConfig);

    if (val !== undefined && val !== null && val !== '') {
      // Apply advanced sanitization
      val = sanitizeValue(path, val);

      // Special override: Check if linking to global brand/publisher
      if (path === 'brand/@id' && globalConfig.enableGlobalBrand) {
        setNestedProperty(result, 'brand/@id', globalConfig.brandId || '#brand');
        setNestedProperty(result, 'brand/name', globalConfig.brandName);
        return;
      }
      
      if (path === 'publisher/@id' && globalConfig.enableGlobalBrand) {
        setNestedProperty(result, 'publisher/@id', globalConfig.brandId || '#brand');
        setNestedProperty(result, 'publisher/name', globalConfig.brandName);
        return;
      }

      // Standard assignment
      setNestedProperty(result, path, val);
    }
  });

  // Post-processing structural adjustments
  
  // JobPosting baseSalary customization for QuantitativeValue nesting
  if (schemaType === 'JobPosting' && result.baseSalary) {
    const salaryVal = result.baseSalary.value;
    const salaryCurr = result.baseSalary.currency;
    const salaryUnit = result.baseSalary.unitText;
    
    if (salaryVal) {
      result.baseSalary.value = {
        '@type': 'QuantitativeValue',
        'value': Number(salaryVal) || salaryVal,
        'unitText': salaryUnit || 'YEAR'
      };
    }
  }

  // Event location customization for Virtual vs Physical
  if (schemaType === 'Event' && result.location) {
    const attendanceMode = result.eventAttendanceMode;
    const isOnline = attendanceMode && (
      attendanceMode.includes('Online') || 
      attendanceMode.toLowerCase() === 'online'
    );

    if (isOnline) {
      result.location = {
        '@type': 'VirtualLocation',
        'url': result.location.url || result.location.name || ''
      };
    } else {
      // If offline, location needs address structure. Ensure it is marked as Place
      result.location['@type'] = 'Place';
    }
  }

  return result;
};

/**
 * Extracts value from a row based on mapping configuration.
 */
const getValue = (row, mapConfig) => {
  if (!mapConfig) return '';
  if (mapConfig.type === 'static') {
    return mapConfig.value;
  }
  if (mapConfig.type === 'column') {
    return row[mapConfig.value] || '';
  }
  return '';
};

/**
 * Compiles a full dataset into a single schema package.
 * Returns either a flat array or a linked @graph.
 */
export const compileDataset = (csvData, mapping, schemaType, globalConfig = {}) => {
  const records = csvData.map(row => compileRow(row, mapping, schemaType, globalConfig));

  if (globalConfig.enableGlobalBrand) {
    const brandEntity = {
      '@type': 'Organization',
      '@id': globalConfig.brandId || '#brand',
      'name': globalConfig.brandName || 'My Brand',
      'url': globalConfig.brandUrl || '',
      'logo': globalConfig.brandLogo || '',
    };

    return {
      '@context': 'https://schema.org',
      '@graph': [
        brandEntity,
        ...records.map(rec => {
          // Remove the individual context to prevent duplicate context warnings in @graph arrays
          const { '@context': _, ...cleanRec } = rec;
          return cleanRec;
        })
      ]
    };
  }

  // Without global entity, output array of clean entities or single context wrapper
  if (records.length === 1) {
    return records[0];
  }

  return {
    '@context': 'https://schema.org',
    '@graph': records.map(rec => {
      const { '@context': _, ...cleanRec } = rec;
      return cleanRec;
    })
  };
};
