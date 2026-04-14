// using Haversine formula to approximate distance in kilometers
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const p = Math.PI / 180;
  
  const a = 0.5 - Math.cos((lat2 - lat1) * p) / 2 + 
            Math.cos(lat1 * p) * Math.cos(lat2 * p) * 
            (1 - Math.cos((lon2 - lon1) * p)) / 2;
            
  return 2 * R * Math.asin(Math.sqrt(a));
}
module.exports = { calculateDistance };
