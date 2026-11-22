import { SpecularButton } from "./reactbits/SpecularButton";
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Crosshair, Expand, Layers3, MapPin, Minus, Plus, X, Check } from 'lucide-react';
import type { AddressResult } from '../lib/addressResolver';
import type { ConfirmedPoint } from '../lib/workspace';

interface Props { result: AddressResult | null; point: ConfirmedPoint | null; onConfirm: (point: ConfirmedPoint | null) => void; }
export function WorkspaceMap({ result, point, onConfirm }: Props) {
  const host = useRef<HTMLDivElement>(null), frame = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null), markers = useRef<L.LayerGroup | null>(null), pickingRef = useRef(false);
  const [picking, setPicking] = useState(false), [candidate, setCandidate] = useState<[number, number] | null>(null);
  const [tilesLoaded, setTilesLoaded] = useState(false), [layersOpen, setLayersOpen] = useState(false), [showRadius, setShowRadius] = useState(true), [expanded, setExpanded] = useState(false);
  const location = result?.location;
  const confirmButton = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (candidate) confirmButton.current?.focus(); }, [candidate]);
  useEffect(() => {
    if (!host.current) return;
    const instance = L.map(host.current, { zoomControl: false, scrollWheelZoom: false, zoomAnimation: false, fadeAnimation: false, markerZoomAnimation: false }).setView([9.0765, 7.3986], 13);
    map.current = instance; markers.current = L.layerGroup().addTo(instance);
    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' });
    tiles.on('tileload', () => setTilesLoaded(true)); tiles.addTo(instance);
    instance.on('click', (e: L.LeafletMouseEvent) => { if (pickingRef.current) setCandidate([e.latlng.lat, e.latlng.lng]); });
    const observer = new ResizeObserver(() => instance.invalidateSize()); observer.observe(host.current);
    return () => { observer.disconnect(); instance.remove(); map.current = null; };
  }, []);
  useEffect(() => { pickingRef.current = picking; }, [picking]);
  useEffect(() => { const close = (event: KeyboardEvent) => { if (event.key === 'Escape') { setExpanded(false); setLayersOpen(false); setPicking(false); setCandidate(null); } }; document.addEventListener('keydown',close); return () => document.removeEventListener('keydown',close); }, []);
  useEffect(() => { setCandidate(null); setPicking(false); }, [result?.id]);
  useEffect(() => {
    const instance = map.current, group = markers.current; if (!instance || !group) return;
    group.clearLayers();
    const coords: [number, number] = point ? [point.latitude, point.longitude] : location ? [location.latitude, location.longitude] : [9.0765, 7.3986];
    if (!candidate) instance.setView(coords, point ? 16 : location ? 13 : 6, { animate: false });
    if (location && !point && showRadius) L.circle(coords, { radius: 1500, color: '#b9c0c8', weight: 1, dashArray: '4 7', fillColor: '#b9c0c8', fillOpacity: 0.055 }).addTo(group);
    if (location || point) L.marker(coords, { icon: L.divIcon({ className: 'wp-marker', html: '<span class="wp-marker-ring"><span></span></span>', iconSize: [48, 48], iconAnchor: [24, 24] }) }).addTo(group);
    if (candidate) L.marker(candidate, { icon: L.divIcon({ className: 'wp-candidate', html: '<span></span>', iconSize: [24, 24], iconAnchor: [12, 12] }) }).addTo(group);
  }, [location, point, candidate, showRadius]);
  return <section className={`map-panel panel ${expanded ? 'map-expanded' : ''}`} ref={frame} aria-label="Address map">
    <div className="map-heading"><div className="heading-with-icon"><MapPin size={16}/><span>Spatial overview</span></div><div className="map-tools"><button className="icon-button" aria-label="Map layers" aria-expanded={layersOpen} onClick={() => setLayersOpen(v => !v)}><Layers3 size={16}/></button><button className="icon-button" aria-label={expanded ? 'Collapse map' : 'Expand map'} onClick={() => setExpanded(v => !v)}>{expanded ? <X size={16}/> : <Expand size={16}/>}</button></div></div>
    <div className={`map-canvas ${picking ? 'is-picking' : ''}`}>
      {!tilesLoaded && <div className="map-unavailable"><MapPin size={26}/><span>Street map loading or unavailable.<br/>Check your connection to view map tiles.</span></div>}
      <div ref={host} className="leaflet-host" role="region" aria-label="Street map. Use arrow keys to pan; press Enter to select the centre while placing a pin." onKeyDown={e => { if (e.key === 'Enter' && picking && map.current) { e.preventDefault(); const centre = map.current.getCenter(); setCandidate([centre.lat, centre.lng]); } } }/>
      <div className="map-location-tag"><span className="tiny-dot"/>{point ? 'Dispatcher-confirmed point' : location ? `${location.name}, ${location.state === 'Federal Capital Territory' ? 'Abuja' : location.state}` : 'Choose a locality to begin'}</div>
      {layersOpen && <div className="map-layers"><label><input type="checkbox" checked={showRadius} onChange={e => setShowRadius(e.target.checked)}/>Locality search area</label><p>A 1.5 km review area around an approximate centre; not an accuracy estimate.</p></div>}
      <div className="map-zoom"><button aria-label="Zoom in" onClick={() => map.current?.zoomIn()}><Plus size={17}/></button><button aria-label="Zoom out" onClick={() => map.current?.zoomOut()}><Minus size={17}/></button><button aria-label="Recenter map" onClick={() => map.current?.setView(point ? [point.latitude, point.longitude] : location ? [location.latitude, location.longitude] : [9.0765, 7.3986], point ? 16 : 13, { animate: false })}><Crosshair size={17}/></button></div>
      <div className="compass"><span>N</span><svg width="18" height="27" viewBox="0 0 18 27"><path d="M9 0L17 25L9 18L1 25Z" fill="#b8bfc7"/><path d="M9 0V18L1 25Z" fill="#5c646e"/></svg></div>
      {picking && <div className="pin-instruction"><Crosshair size={16}/><span>Click the map, or use arrow keys then Enter, to place a point</span><button className="icon-button" aria-label="Cancel placing point" onClick={() => { setPicking(false); setCandidate(null); }}><X size={15}/></button></div>}
      {candidate && <div className="candidate-card"><div><strong>Confirm the delivery point</strong><p>{candidate[0].toFixed(6)}, {candidate[1].toFixed(6)}</p></div><SpecularButton ref={confirmButton} className="button primary small" onClick={() => { onConfirm({ latitude: candidate[0], longitude: candidate[1], source: 'dispatcher_confirmed' }); setPicking(false); setCandidate(null); }}><Check size={15}/>Confirm point</SpecularButton></div>}
      
    </div>
    <div className="map-footer"><div><span className="eyebrow">{point ? 'CONFIRMED COORDINATES' : 'APPROXIMATE LOCALITY'}</span><span className="coordinate-text">{point ? `${point.latitude.toFixed(5)}° N  ${point.longitude.toFixed(5)}° E` : location ? `${location.latitude.toFixed(4)}° N  ${location.longitude.toFixed(4)}° E` : 'No location detected'}</span></div><button className="button secondary small" disabled={!location || (!point && !tilesLoaded)} onClick={() => { if (point) onConfirm(null); else { setPicking(v => !v); host.current?.focus(); } }}><MapPin size={14}/>{point ? 'Reset point' : 'Place delivery pin'}</button></div>
  </section>;
}
