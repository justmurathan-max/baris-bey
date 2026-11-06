// satis-kaynak/build.py üretir; elle değiştirmeyin. Fiyatlar TL, KDV dâhil.
export const SURUM = "2026-11-07.33db78b5";
export const SATICI = "Barış Kılıçarslan";
export type Urun = { ad: string; fiyat: number | null; kargo: boolean; dijital: boolean; kargo_ucreti: number | null; en_fazla: number; kategori: string };
export const KATALOG: Record<string, Urun> = {
  "ss": {
    "ad": "Satışın Şifreleri Online Eğitim Seti",
    "fiyat": 9797,
    "kargo": true,
    "dijital": true,
    "kargo_ucreti": 0,
    "en_fazla": 1,
    "kategori": "Online eğitim"
  },
  "gus": {
    "ad": "Gayrimenkulün Usta Satışçıları Online Eğitim Seti",
    "fiyat": 9797,
    "kargo": false,
    "dijital": true,
    "kargo_ucreti": 0,
    "en_fazla": 1,
    "kategori": "Online eğitim"
  },
  "kitap": {
    "ad": "Satışın Şifreleri ile Sonucu Satmak",
    "fiyat": null,
    "kargo": true,
    "dijital": false,
    "kargo_ucreti": null,
    "en_fazla": 10,
    "kategori": "Kitap"
  }
};
