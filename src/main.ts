import { AmbientLight } from './ambient-light';
import './style.css';

const video = document.getElementById('video') as HTMLVideoElement;
const ambientLight = new AmbientLight(video);

ambientLight.on();
