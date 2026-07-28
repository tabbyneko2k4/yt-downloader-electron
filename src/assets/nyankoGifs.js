import gif0 from './nyanko_gif/Nyanko_Cry 1_2026-07-28-17-55-30.gif';
import gif1 from './nyanko_gif/Nyanko_Cry 2_2026-07-28-17-55-31.gif';
import gif2 from './nyanko_gif/Nyanko_Cry 3_2026-07-28-17-55-32.gif';
import gif3 from './nyanko_gif/Nyanko_Dance (Caramelldansen)_2026-07-28-17-55-45.gif';
import gif4 from './nyanko_gif/Nyanko_Dance (Helltaker)_2026-07-28-17-55-43.gif';
import gif5 from './nyanko_gif/Nyanko_Dance (Low Cortisol)_2026-07-28-17-55-45.gif';
import gif6 from './nyanko_gif/Nyanko_Dance (Scuba)_2026-07-28-17-55-48.gif';
import gif7 from './nyanko_gif/Nyanko_Dance 1_2026-07-28-17-55-36.gif';
import gif8 from './nyanko_gif/Nyanko_Dizzy_2026-07-28-17-55-54.gif';
import gif9 from './nyanko_gif/Nyanko_PNGTuber Idle 2_2026-07-28-17-55-01.gif';
import gif10 from './nyanko_gif/Nyanko_PNGTuber Idle_2026-07-28-17-54-58.gif';
import gif11 from './nyanko_gif/Nyanko_PNGTuber Loading_2026-07-28-17-55-02.gif';
import gif12 from './nyanko_gif/Nyanko_PNGTuber Talk 2_2026-07-28-17-55-21.gif';
import gif13 from './nyanko_gif/Nyanko_PNGTuber Talk_2026-07-28-17-55-20.gif';
import gif14 from './nyanko_gif/Nyanko_PNGTuber Yap_2026-07-28-17-55-22.gif';
import gif15 from './nyanko_gif/Nyanko_Scared 1_2026-07-28-17-54-27.gif';
import gif16 from './nyanko_gif/Nyanko_Scared 2_2026-07-28-17-54-25.gif';
import gif17 from './nyanko_gif/Nyanko_TrashTuber Idle_2026-07-28-17-54-38.gif';
import gif18 from './nyanko_gif/Nyanko_TrashTuber Talk_2026-07-28-17-54-40.gif';
import gif19 from './nyanko_gif/Nyanko_TrashTuber Yap_2026-07-28-17-54-42.gif';

export const NYANKO_GIFS = [
  gif0,
  gif1,
  gif2,
  gif3,
  gif4,
  gif5,
  gif6,
  gif7,
  gif8,
  gif9,
  gif10,
  gif11,
  gif12,
  gif13,
  gif14,
  gif15,
  gif16,
  gif17,
  gif18,
  gif19
];

export const getRandomNyankoGif = () => NYANKO_GIFS[Math.floor(Math.random() * NYANKO_GIFS.length)];
export default NYANKO_GIFS;
