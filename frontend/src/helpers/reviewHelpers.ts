export function existeResena(
  reviews: any[],
  eventoId: any,
  destinoId: any,
  tipoDestino: 'Club' | 'DJ'
): boolean {
  if (!reviews || reviews.length === 0 || !eventoId || !destinoId) {
    return false;
  }
  function extractIds(obj: any): string[] {
    const ids = [];
    if (typeof obj === 'string' && obj.trim() !== '') {
      ids.push(obj);
    }
    if (obj && typeof obj === 'object') {
      if (obj.$oid) {
        ids.push(obj.$oid);
      }
      if (obj._id) {
        if (typeof obj._id === 'string') {
          ids.push(obj._id);
        } else if (obj._id.$oid) {
          ids.push(obj._id.$oid);
        } else if (typeof obj._id.toString === 'function') {
          ids.push(obj._id.toString());
        }
      }
      if (typeof obj.toString === 'function') {
        const strValue = obj.toString();
        if (typeof strValue === 'string' && strValue !== '[object Object]') {
          ids.push(strValue);
        }
      }
    }
    return [...new Set(ids.map(id => id.trim()))];
  }
  const eventoIds = extractIds(eventoId);
  const destinoIds = extractIds(destinoId);
  if (eventoIds.length === 0 || destinoIds.length === 0) {
    return false;
  }
  return reviews.some(review => {
    if (review.tipoDestino !== tipoDestino) {
      return false;
    }
    const reviewEventoIds = extractIds(review.eventoId);
    const reviewDestinoIds = extractIds(review.destinoId);
    const eventoCoincide = eventoIds.some(eId => 
      reviewEventoIds.some(rId => rId === eId)
    );
    const destinoCoincide = destinoIds.some(dId => 
      reviewDestinoIds.some(rId => rId === dId)
    );
    return eventoCoincide && destinoCoincide;
  });
}

export function clubYaValorado(reviewsMap: {[key: string]: boolean}, eventoId: any, clubId: any): boolean {
  if (!reviewsMap || !eventoId || !clubId) return false;
  try {
    const extractIds = (id: any): string[] => {
      const ids = new Set<string>();
      if (typeof id === 'string' && id.trim() !== '') {
        ids.add(id.trim());
      }
      if (id && typeof id === 'object') {
        if (id.$oid) {
          ids.add(id.$oid.toString().trim());
        }
        if (id._id) {
          if (typeof id._id === 'string') {
            ids.add(id._id.trim());
          } else if (id._id.$oid) {
            ids.add(id._id.$oid.toString().trim());
          } else if (typeof id._id.toString === 'function') {
            const idStr = id._id.toString();
            if (idStr !== '[object Object]') ids.add(idStr.trim());
          }
        }
        if (typeof id.toString === 'function') {
          const strValue = id.toString();
          if (typeof strValue === 'string' && strValue !== '[object Object]') {
            ids.add(strValue.trim());
          }
        }
      }
        return Array.from(ids);
    };
    const reseñaEnviada = sessionStorage.getItem('clubly_review_submitted') === 'true';
    if (reseñaEnviada) {
      const tipoDestino = sessionStorage.getItem('clubly_review_submitted_tipo') || '';
      const eventoIdStorage = sessionStorage.getItem('clubly_review_submitted_evento') || '';
      const destinoIdStorage = sessionStorage.getItem('clubly_review_submitted_destino') || '';
      if (tipoDestino.toLowerCase() === 'club') {
        const normalizedEventoId = extractIds(eventoId);
        const normalizedClubId = extractIds(clubId);
        for (const eId of normalizedEventoId) {
          if (eId === eventoIdStorage || eventoIdStorage.includes(eId) || eId.includes(eventoIdStorage)) {
            for (const cId of normalizedClubId) {
              if (cId === destinoIdStorage || destinoIdStorage.includes(cId) || cId.includes(destinoIdStorage)) {                return true;
              }
            }
          }
        }
      }
    }
    const eventoIds = extractIds(eventoId);
    const clubIds = extractIds(clubId);
    for (const eId of eventoIds) {
      for (const cId of clubIds) {
        const key = `club-${eId}-${cId}`;
        if (reviewsMap[key]) {          return true;
        }
      }
    }
    const allCacheKeys = Object.keys(reviewsMap);
    for (const eId of eventoIds) {
      for (const cId of clubIds) {
        const keyPattern = `club-${eId}-${cId}`;
        const matchingKey = allCacheKeys.find(k => 
          k.startsWith(keyPattern) || 
          k.includes(`-${eId}-`) || 
          (k.startsWith('club-') && k.includes(eId) && k.includes(cId)) 
        );
        if (matchingKey) {          return true;
        }
      }
    }
    return false;  } catch (error) {
    return false;
  }
}

export function djYaValorado(reviewsMap: {[key: string]: boolean}, eventoId: any, djId?: any): boolean {
  if (!reviewsMap || !eventoId) return false;
  try {
    const extractIds = (id: any): string[] => {
      const ids = new Set<string>();
      if (typeof id === 'string' && id.trim() !== '') {
        ids.add(id.trim());
      }
      if (id && typeof id === 'object') {
        if (id.$oid) {
          ids.add(id.$oid.toString().trim());
        }
        if (id._id) {
          if (typeof id._id === 'string') {
            ids.add(id._id.trim());
          } else if (id._id.$oid) {
            ids.add(id._id.$oid.toString().trim());
          } else if (typeof id._id.toString === 'function') {
            const idStr = id._id.toString();
            if (idStr !== '[object Object]') ids.add(idStr.trim());
          }
        }
        if (typeof id.toString === 'function') {
          const strValue = id.toString();
          if (typeof strValue === 'string' && strValue !== '[object Object]') {
            ids.add(strValue.trim());
          }
        }
      }
      return Array.from(ids);
    };
    const eventoIds = extractIds(eventoId);
    const reseñaEnviada = sessionStorage.getItem('clubly_review_submitted') === 'true';
    if (reseñaEnviada) {
      const tipoDestino = sessionStorage.getItem('clubly_review_submitted_tipo') || '';
      const eventoIdStorage = sessionStorage.getItem('clubly_review_submitted_evento') || '';
      if (tipoDestino.toLowerCase() === 'dj') {
        for (const eId of eventoIds) {
          if (eId === eventoIdStorage || eventoIdStorage.includes(eId) || eId.includes(eventoIdStorage)) {
            return true;
          }
        }
      }
    }
    for (const eId of eventoIds) {
      const simpleKey = `dj-${eId}`;
      if (reviewsMap[simpleKey]) {
        return true;
      }
    }
    if (djId) {
      const djIds = extractIds(djId);
      for (const eId of eventoIds) {
        for (const dId of djIds) {
          const fullKey = `dj-${eId}-${dId}`;
          if (reviewsMap[fullKey]) {
            return true;
          }
        }
      }
    }
    const allCacheKeys = Object.keys(reviewsMap);
    for (const eId of eventoIds) {
      const keyPattern = `dj-${eId}`;
      const matchingKey = allCacheKeys.find(k => 
        k === keyPattern || 
        k.startsWith(`${keyPattern}-`) || 
        k.includes(eId) 
      );
      if (matchingKey) {
        return true;
      }
    }
    return false;
  } catch (error) {
    return false;
  }
}

export function marcarResenaEnviada(tipoDestino: string, eventoId: any, destinoId: any): void {
  try {
    const timestamp = new Date().toISOString();
    function extractAllIdFormats(id: any): string[] {
      const formats: string[] = [];
      if (!id) return formats;
      if (typeof id === 'string' && id.trim() !== '') {
        formats.push(id.trim());
      }
      if (id && typeof id === 'object') {
        if (id.$oid) {
          formats.push(id.$oid.toString().trim());
        }
        if (id._id) {
          if (typeof id._id === 'string') {
            formats.push(id._id.trim());
          } else if (id._id.$oid) {
            formats.push(id._id.$oid.toString().trim());
          } else if (typeof id._id.toString === 'function') {
            formats.push(id._id.toString().trim());
          }
        }
        if (typeof id.toString === 'function') {
          const strValue = id.toString();
          if (strValue && strValue !== '[object Object]') {
            formats.push(strValue.trim());
          }
        }
      }
      return formats.filter(f => f);
    }
    const eventoFormats = extractAllIdFormats(eventoId);
    const destinoFormats = extractAllIdFormats(destinoId);
    const eventoIdStr = eventoFormats.length > 0 ? eventoFormats[0] : '';
    const destinoIdStr = destinoFormats.length > 0 ? destinoFormats[0] : '';
    sessionStorage.setItem('clubly_review_submitted', 'true');
    sessionStorage.setItem('clubly_review_submitted_time', timestamp);
    sessionStorage.setItem('clubly_review_submitted_tipo', tipoDestino.toLowerCase());
    sessionStorage.setItem('clubly_review_submitted_evento', eventoIdStr);
    sessionStorage.setItem('clubly_review_submitted_destino', destinoIdStr);
    if (eventoFormats.length > 1) {
      sessionStorage.setItem('clubly_review_submitted_evento_alt', JSON.stringify(eventoFormats));
    }
    if (destinoFormats.length > 1) {
      sessionStorage.setItem('clubly_review_submitted_destino_alt', JSON.stringify(destinoFormats));
    }
  } catch (error) {
  }
}

export function generarMapaResenas(reviews: any[]): {[key: string]: boolean} {
  const mapa: {[key: string]: boolean} = {};
  if (!reviews || reviews.length === 0) {
    return mapa;
  }
  const reseñaEnviada = sessionStorage.getItem('clubly_review_submitted') === 'true';
  if (reseñaEnviada) {
    const tipoDestino = sessionStorage.getItem('clubly_review_submitted_tipo') || '';
    const eventoId = sessionStorage.getItem('clubly_review_submitted_evento') || '';
    const destinoId = sessionStorage.getItem('clubly_review_submitted_destino') || '';
    if (eventoId) {
      if (tipoDestino.toLowerCase() === 'club' && eventoId && destinoId) {
        const cacheKey = `club-${eventoId}-${destinoId}`;
        mapa[cacheKey] = true;
      } 
      else if (tipoDestino.toLowerCase() === 'dj') {
        const simpleKey = `dj-${eventoId}`;
        mapa[simpleKey] = true;
        if (destinoId) {
          const fullKey = `dj-${eventoId}-${destinoId}`;
          mapa[fullKey] = true;
        }
      }
    }
  }
  function extractIds(obj: any): string[] {
    const ids = new Set<string>();
    if (typeof obj === 'string' && obj.trim() !== '') {
      ids.add(obj.trim());
    }
    if (obj && typeof obj === 'object') {
      if (obj.$oid) {
        ids.add(obj.$oid.toString().trim());
      }
      if (obj._id) {
        if (typeof obj._id === 'string') {
          ids.add(obj._id.trim());
        } else if (obj._id.$oid) {
          ids.add(obj._id.$oid.toString().trim());
        } else if (typeof obj._id.toString === 'function') {
          const idStr = obj._id.toString();
          if (idStr !== '[object Object]') ids.add(idStr.trim());
        }
      }
      if (typeof obj.toString === 'function') {
        const strValue = obj.toString();
        if (typeof strValue === 'string' && strValue !== '[object Object]') {
          ids.add(strValue.trim());
        }
      }
    }
    return Array.from(ids);
  }
  reviews.forEach((review) => {
    if (!review || !review.eventoId || !review.tipoDestino) {
      return;
    }
    try {
      const tipo = review.tipoDestino.toLowerCase() === 'club' ? 'club' : 'dj';
      const eventoIds = extractIds(review.eventoId);
      eventoIds.forEach(eventoId => {
        if (tipo === 'dj') {
          const simpleCacheKey = `dj-${eventoId}`;
          mapa[simpleCacheKey] = true;
          if (review.destinoId) {
            const destinoIds = extractIds(review.destinoId);
            destinoIds.forEach(destinoId => {
              const fullCacheKey = `dj-${eventoId}-${destinoId}`;
              mapa[fullCacheKey] = true;
              const alternativeKey = `dj${eventoId}${destinoId}`;
              mapa[alternativeKey] = true;
            });
          }
        }
        else {
          if (review.destinoId) {
            const destinoIds = extractIds(review.destinoId);
            destinoIds.forEach(destinoId => {
              const cacheKey = `club-${eventoId}-${destinoId}`;
              mapa[cacheKey] = true;
              const alternativeKey = `club${eventoId}${destinoId}`;
              mapa[alternativeKey] = true;
            });
          }
        }
      });
    } catch (error) {
    }
  });
  return mapa;
}
