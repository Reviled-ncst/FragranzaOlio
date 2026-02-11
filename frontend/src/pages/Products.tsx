import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, Grid3X3, List, X } from 'lucide-react';

import ProductCard from '../components/ui/ProductCard';
import SectionHeader from '../components/ui/SectionHeader';
import { ProductGridSkeleton } from '../components/ui/Skeleton';
import Button from '../components/ui/Button';
import { productService, Product as APIProduct, Category } from '../services/productServicePHP';

// Transform API product to ProductCard format
interface ProductCardData {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  isNew?: boolean;
  isFeatured?: boolean;
  inspiredBy?: string;
}

// Helper to get full image URL
const getImageUrl = (imagePath: string | null): string => {
  if (!imagePath) return '';
  // If it's already a full URL, return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  // If it's an uploaded file (starts with /uploads), prepend backend URL
  if (imagePath.startsWith('/uploads')) {
    return `http://localhost/FragranzaWeb/backend${imagePath}`;
  }
  // Otherwise it's a static asset from frontend public folder
  return imagePath;
};

const transformProduct = (product: APIProduct): ProductCardData => ({
  id: product.id,
  name: product.name,
  price: product.price,
  image: getImageUrl(product.image_main),
  category: product.category?.name || 'Uncategorized',
  isNew: product.is_new,
  isFeatured: product.is_featured,
});

// Placeholder for backward compatibility (will be replaced by API data)
const defaultProducts: ProductCardData[] = [
  // Women's Perfumes
  {
    id: 1,
    name: 'Blossom',
    price: 380,
    image: "/assets/images/Women's Perfume/G1 Blossom.png",
    category: "Women's Perfume",
    isNew: true,
    isFeatured: true,
  },
  {
    id: 2,
    name: 'Aurora',
    price: 420,
    image: "/assets/images/Women's Perfume/G3 Aurora.png",
    category: "Women's Perfume",
    isFeatured: true,
  },
  {
    id: 3,
    name: 'Beatrice',
    price: 395,
    image: "/assets/images/Women's Perfume/G4 Beatrice.png",
    category: "Women's Perfume",
    isNew: true,
  },
  {
    id: 4,
    name: 'Behind Scent',
    price: 350,
    image: "/assets/images/Women's Perfume/G5 Behind Scent.png",
    category: "Women's Perfume",
  },
  {
    id: 5,
    name: 'Bella',
    price: 365,
    image: "/assets/images/Women's Perfume/G6 Bella.png",
    category: "Women's Perfume",
    isFeatured: true,
  },
  {
    id: 6,
    name: 'Berry Wine',
    price: 340,
    image: "/assets/images/Women's Perfume/G7 Berry Wine.png",
    category: "Women's Perfume",
  },
  {
    id: 7,
    name: 'Blue Heart',
    price: 385,
    image: "/assets/images/Women's Perfume/G8 Blue Heart.png",
    category: "Women's Perfume",
    isNew: true,
  },
  {
    id: 84,
    name: 'Choco Tart',
    price: 355,
    image: "/assets/images/Women's Perfume/G9 Choco Tart.png",
    category: "Women's Perfume",
  },
  {
    id: 85,
    name: 'Chloe',
    price: 410,
    image: "/assets/images/Women's Perfume/G10 Chloe.png",
    category: "Women's Perfume",
    isFeatured: true,
  },
  {
    id: 86,
    name: 'Cotton Love',
    price: 360,
    image: "/assets/images/Women's Perfume/G11 Cotton Love.png",
    category: "Women's Perfume",
  },
  {
    id: 87,
    name: 'Crescent Europhia',
    price: 450,
    image: "/assets/images/Women's Perfume/G12 Crescent Europhia.png",
    category: "Women's Perfume",
    isNew: true,
  },
  {
    id: 88,
    name: 'Decent Moon',
    price: 390,
    image: "/assets/images/Women's Perfume/G13 Decent Moon.png",
    category: "Women's Perfume",
  },
  {
    id: 89,
    name: 'Eternal Splash',
    price: 375,
    image: "/assets/images/Women's Perfume/G14 Eternal Splash.png",
    category: "Women's Perfume",
    isFeatured: true,
  },
  {
    id: 90,
    name: 'Fairy Princess',
    price: 425,
    image: "/assets/images/Women's Perfume/G15 Fairy Princess.png",
    category: "Women's Perfume",
  },
  {
    id: 91,
    name: 'Felicity',
    price: 380,
    image: "/assets/images/Women's Perfume/G16 Felicity.png",
    category: "Women's Perfume",
    isNew: true,
  },
  {
    id: 92,
    name: 'Flirty',
    price: 345,
    image: "/assets/images/Women's Perfume/G17 Flirty.png",
    category: "Women's Perfume",
  },
  {
    id: 93,
    name: 'Floral Purity',
    price: 395,
    image: "/assets/images/Women's Perfume/G18 Floral Purity.png",
    category: "Women's Perfume",
  },
  {
    id: 94,
    name: 'Flower Plum',
    price: 370,
    image: "/assets/images/Women's Perfume/G19 Flower Plum.png",
    category: "Women's Perfume",
    isFeatured: true,
  },
  {
    id: 95,
    name: 'Freesia',
    price: 355,
    image: "/assets/images/Women's Perfume/G20 freesia.png",
    category: "Women's Perfume",
  },
  {
    id: 96,
    name: 'Fresh Mist',
    price: 340,
    image: "/assets/images/Women's Perfume/G21 Fresh Mist.png",
    category: "Women's Perfume",
    isNew: true,
  },
  {
    id: 97,
    name: 'Gorgeous',
    price: 430,
    image: "/assets/images/Women's Perfume/G22 Gorgeous.png",
    category: "Women's Perfume",
  },
  {
    id: 98,
    name: 'Ladies Cotton',
    price: 365,
    image: "/assets/images/Women's Perfume/G25 Ladies Cotton.png",
    category: "Women's Perfume",
  },
  {
    id: 99,
    name: 'Lovely Chel',
    price: 385,
    image: "/assets/images/Women's Perfume/G26 Lovely Chel.png",
    category: "Women's Perfume",
    isFeatured: true,
  },
  {
    id: 100,
    name: 'Lucy',
    price: 350,
    image: "/assets/images/Women's Perfume/G27 Lucy.png",
    category: "Women's Perfume",
  },
  {
    id: 101,
    name: 'Lush Cherry',
    price: 375,
    image: "/assets/images/Women's Perfume/G28 Lush Cherry.png",
    category: "Women's Perfume",
    isNew: true,
  },
  {
    id: 102,
    name: 'Magical',
    price: 400,
    image: "/assets/images/Women's Perfume/G29 Magical.png",
    category: "Women's Perfume",
  },
  {
    id: 103,
    name: 'Majesty',
    price: 460,
    image: "/assets/images/Women's Perfume/G30 Majesty.png",
    category: "Women's Perfume",
    isFeatured: true,
  },
  {
    id: 104,
    name: 'Maldita',
    price: 345,
    image: "/assets/images/Women's Perfume/G31 Maldita.png",
    category: "Women's Perfume",
  },
  {
    id: 105,
    name: 'Mint Snow',
    price: 355,
    image: "/assets/images/Women's Perfume/G32 Mint Snow.png",
    category: "Women's Perfume",
    isNew: true,
  },
  {
    id: 106,
    name: 'Petal & Musk',
    price: 390,
    image: "/assets/images/Women's Perfume/G33 Petal & Musk.png",
    category: "Women's Perfume",
  },
  {
    id: 107,
    name: 'Queen Jasmine',
    price: 420,
    image: "/assets/images/Women's Perfume/G34 Queen Jasmine.png",
    category: "Women's Perfume",
    isFeatured: true,
  },
  {
    id: 108,
    name: 'Rainbow',
    price: 360,
    image: "/assets/images/Women's Perfume/G35 Rainbow.png",
    category: "Women's Perfume",
  },
  {
    id: 109,
    name: 'Reina',
    price: 440,
    image: "/assets/images/Women's Perfume/G36 Reina.png",
    category: "Women's Perfume",
    isNew: true,
  },
  {
    id: 110,
    name: 'Kiss to Kiss',
    price: 370,
    image: "/assets/images/Women's Perfume/G37 Kiss to Kiss.png",
    category: "Women's Perfume",
  },
  {
    id: 111,
    name: 'Rose',
    price: 385,
    image: "/assets/images/Women's Perfume/G37 Rose.png",
    category: "Women's Perfume",
  },
  {
    id: 112,
    name: 'Señora',
    price: 410,
    image: "/assets/images/Women's Perfume/G38 Señora.png",
    category: "Women's Perfume",
    isFeatured: true,
  },
  {
    id: 113,
    name: 'Scarlet',
    price: 395,
    image: "/assets/images/Women's Perfume/G39 Scarlet.png",
    category: "Women's Perfume",
  },
  {
    id: 114,
    name: 'Smile',
    price: 340,
    image: "/assets/images/Women's Perfume/G40 Smile.png",
    category: "Women's Perfume",
    isNew: true,
  },
  {
    id: 115,
    name: 'Snow Drop',
    price: 365,
    image: "/assets/images/Women's Perfume/G41 Snow Drop.png",
    category: "Women's Perfume",
  },
  {
    id: 116,
    name: 'Stella',
    price: 400,
    image: "/assets/images/Women's Perfume/G42 Stella.png",
    category: "Women's Perfume",
  },
  {
    id: 117,
    name: 'Sunshine',
    price: 355,
    image: "/assets/images/Women's Perfume/G43 Sunshine.png",
    category: "Women's Perfume",
    isFeatured: true,
  },
  {
    id: 118,
    name: 'Sweet Cloud',
    price: 375,
    image: "/assets/images/Women's Perfume/G44 Sweet Cloud.png",
    category: "Women's Perfume",
  },
  {
    id: 119,
    name: 'Vanilla',
    price: 360,
    image: "/assets/images/Women's Perfume/G45 Vanilla.png",
    category: "Women's Perfume",
    isNew: true,
  },
  {
    id: 120,
    name: 'Valentina',
    price: 450,
    image: "/assets/images/Women's Perfume/G46 Valentina.png",
    category: "Women's Perfume",
    isFeatured: true,
  },
  {
    id: 121,
    name: 'Valois',
    price: 420,
    image: "/assets/images/Women's Perfume/G47 Valois.png",
    category: "Women's Perfume",
  },
  {
    id: 122,
    name: 'Valor',
    price: 390,
    image: "/assets/images/Women's Perfume/G48 Valor.png",
    category: "Women's Perfume",
  },
  {
    id: 123,
    name: 'Lorraine',
    price: 405,
    image: "/assets/images/Women's Perfume/G49 Lorraine.png",
    category: "Women's Perfume",
    isNew: true,
  },
  {
    id: 124,
    name: 'Chance',
    price: 430,
    image: "/assets/images/Women's Perfume/G50 Chance.png",
    category: "Women's Perfume",
  },
  {
    id: 125,
    name: 'Pinky',
    price: 345,
    image: "/assets/images/Women's Perfume/G52 Pinky.png",
    category: "Women's Perfume",
    isFeatured: true,
  },
  {
    id: 126,
    name: 'Girlfriend',
    price: 360,
    image: "/assets/images/Women's Perfume/G53 Girlfriend.png",
    category: "Women's Perfume",
  },
  {
    id: 127,
    name: 'Romance',
    price: 395,
    image: "/assets/images/Women's Perfume/G54 Romance.png",
    category: "Women's Perfume",
    isNew: true,
  },
  {
    id: 128,
    name: 'Top Secret',
    price: 410,
    image: "/assets/images/Women's Perfume/G55 Top Secret.png",
    category: "Women's Perfume",
  },
  {
    id: 129,
    name: 'Champagne',
    price: 440,
    image: "/assets/images/Women's Perfume/G56 Champagne.png",
    category: "Women's Perfume",
    isFeatured: true,
  },
  {
    id: 130,
    name: 'Velvet',
    price: 385,
    image: "/assets/images/Women's Perfume/G57 Velvet.png",
    category: "Women's Perfume",
  },
  {
    id: 131,
    name: 'Jimmy C',
    price: 420,
    image: "/assets/images/Women's Perfume/G58 Jimmy C.png",
    category: "Women's Perfume",
    isNew: true,
  },
  {
    id: 132,
    name: 'Killer Queen',
    price: 465,
    image: "/assets/images/Women's Perfume/G59 Killer Queen.png",
    category: "Women's Perfume",
    isFeatured: true,
  },
  {
    id: 133,
    name: 'Sanggre',
    price: 380,
    image: "/assets/images/Women's Perfume/G61 Sanggre.png",
    category: "Women's Perfume",
  },
  {
    id: 134,
    name: 'Ashtee',
    price: 355,
    image: "/assets/images/Women's Perfume/G62 Ashtee.png",
    category: "Women's Perfume",
  },
  {
    id: 135,
    name: 'Makiling',
    price: 400,
    image: "/assets/images/Women's Perfume/G63 Makiling.png",
    category: "Women's Perfume",
    isNew: true,
  },
  {
    id: 136,
    name: 'Sweetness',
    price: 350,
    image: "/assets/images/Women's Perfume/G69 Sweetness.png",
    category: "Women's Perfume",
  },
  // Men's Cologne
  {
    id: 8,
    name: 'Acqua Fresh',
    price: 280,
    image: "/assets/images/Men's Perfume/B1 Acqua Fresh.png",
    category: "Men's Perfume",
    inspiredBy: 'Cool Water Men',
    isFeatured: true,
  },
  {
    id: 9,
    name: 'Amour Desire',
    price: 320,
    image: "/assets/images/Men's Perfume/B2 Amour Desire.png",
    category: "Men's Perfume",
    inspiredBy: 'Eclat For Men',
  },
  {
    id: 10,
    name: 'Big Boss',
    price: 290,
    image: "/assets/images/Men's Perfume/B3 Big Boss.png",
    category: "Men's Perfume",
    inspiredBy: 'Polo Red',
    isNew: true,
  },
  {
    id: 11,
    name: 'Black Gold',
    price: 310,
    image: "/assets/images/Men's Perfume/B4 Black Gold.png",
    category: "Men's Perfume",
    inspiredBy: 'Diesel Fuel',
  },
  {
    id: 12,
    name: 'Black Swan',
    price: 340,
    image: "/assets/images/Men's Perfume/b5 Black Swan.png",
    category: "Men's Perfume",
    inspiredBy: 'Invictus Aqua',
    isFeatured: true,
  },
  {
    id: 24,
    name: 'Bouche Bee',
    price: 295,
    image: "/assets/images/Men's Perfume/b6 Bouche Bee .png",
    category: "Men's Perfume",
    inspiredBy: 'Aqua Amara',
  },
  {
    id: 25,
    name: 'Chill',
    price: 275,
    image: "/assets/images/Men's Perfume/b7 Chill.png",
    category: "Men's Perfume",
    inspiredBy: 'Bvlgari Man Extreme',
    isNew: true,
  },
  {
    id: 26,
    name: 'Crimson Moon',
    price: 350,
    image: "/assets/images/Men's Perfume/b8 Crimson Moon.png",
    category: "Men's Perfume",
    inspiredBy: 'Polo Sport',
    isFeatured: true,
  },
  {
    id: 27,
    name: 'Delight',
    price: 285,
    image: "/assets/images/Men's Perfume/b9 Delight.png",
    category: "Men's Perfume",
    inspiredBy: 'Polo Blue',
  },
  {
    id: 28,
    name: 'Delux',
    price: 360,
    image: "/assets/images/Men's Perfume/b10 Delux .png",
    category: "Men's Perfume",
    inspiredBy: '1 Million',
  },
  {
    id: 29,
    name: 'Dreamer',
    price: 305,
    image: "/assets/images/Men's Perfume/b11 Dreamer.png",
    category: "Men's Perfume",
    inspiredBy: 'VIP Black',
    isNew: true,
  },
  {
    id: 30,
    name: 'Dylan',
    price: 315,
    image: "/assets/images/Men's Perfume/b12 Dylan.png",
    category: "Men's Perfume",
    inspiredBy: 'Acqua Di Gio',
  },
  {
    id: 31,
    name: 'DAHX',
    price: 330,
    image: "/assets/images/Men's Perfume/b13 DAHX.png",
    category: "Men's Perfume",
    inspiredBy: 'Banana Republic M',
  },
  {
    id: 32,
    name: 'Endless',
    price: 295,
    image: "/assets/images/Men's Perfume/b14 Endless.png",
    category: "Men's Perfume",
    inspiredBy: 'CK Eternity',
  },
  {
    id: 33,
    name: 'Falling Love',
    price: 320,
    image: "/assets/images/Men's Perfume/b15 Falling Love.png",
    category: "Men's Perfume",
    inspiredBy: 'Mont Blanc',
    isNew: true,
  },
  {
    id: 34,
    name: 'Gentle',
    price: 285,
    image: "/assets/images/Men's Perfume/b16 Gentle.png",
    category: "Men's Perfume",
    inspiredBy: 'Clinique Happy Men',
  },
  {
    id: 35,
    name: 'Holmes',
    price: 340,
    image: "/assets/images/Men's Perfume/b17 Holmes.png",
    category: "Men's Perfume",
    inspiredBy: 'Lacoste Green',
    isFeatured: true,
  },
  {
    id: 36,
    name: 'Hot Maker',
    price: 310,
    image: "/assets/images/Men's Perfume/b19 Hot Maker.png",
    category: "Men's Perfume",
    inspiredBy: 'Lacoste Blue',
  },
  {
    id: 37,
    name: 'Instinct',
    price: 295,
    image: "/assets/images/Men's Perfume/b20 Instinct.png",
    category: "Men's Perfume",
    inspiredBy: 'First Instinct',
  },
  {
    id: 38,
    name: 'Jade Emperor',
    price: 380,
    image: "/assets/images/Men's Perfume/b21 Jade Emperor.png",
    category: "Men's Perfume",
    inspiredBy: 'Diesel Brave',
    isNew: true,
  },
  {
    id: 39,
    name: 'Kim',
    price: 275,
    image: "/assets/images/Men's Perfume/b22 Kim.png",
    category: "Men's Perfume",
    inspiredBy: 'Lacoste Black',
  },
  {
    id: 40,
    name: 'Little Sweet',
    price: 290,
    image: "/assets/images/Men's Perfume/b23 Little Sweet.png",
    category: "Men's Perfume",
    inspiredBy: 'Polo Black',
  },
  {
    id: 41,
    name: 'Magical Scent',
    price: 325,
    image: "/assets/images/Men's Perfume/b24 Magical Scent.png",
    category: "Men's Perfume",
    inspiredBy: 'Issey Miyake',
    isFeatured: true,
  },
  {
    id: 42,
    name: 'Masculine',
    price: 305,
    image: "/assets/images/Men's Perfume/b25 Mascuine.png",
    category: "Men's Perfume",
    inspiredBy: 'Versace Eros',
  },
  {
    id: 43,
    name: 'Prince',
    price: 350,
    image: "/assets/images/Men's Perfume/b26 Prince.png",
    category: "Men's Perfume",
    inspiredBy: 'Tommy Boy',
  },
  {
    id: 44,
    name: 'Purity',
    price: 280,
    image: "/assets/images/Men's Perfume/b27 Purity.png",
    category: "Men's Perfume",
    inspiredBy: 'Lacoste White',
  },
  {
    id: 45,
    name: 'Royal Flourous',
    price: 365,
    image: "/assets/images/Men's Perfume/b28 Royal Flourous.png",
    category: "Men's Perfume",
    inspiredBy: 'Fahrenheit',
    isNew: true,
  },
  {
    id: 46,
    name: 'Seductive',
    price: 340,
    image: "/assets/images/Men's Perfume/b29 Seductive.png",
    category: "Men's Perfume",
    inspiredBy: 'Intenso',
    isFeatured: true,
  },
  {
    id: 47,
    name: 'Sirius',
    price: 320,
    image: "/assets/images/Men's Perfume/b30 Sirius.png",
    category: "Men's Perfume",
    inspiredBy: 'Invictus Intense',
  },
  {
    id: 48,
    name: 'Sky',
    price: 295,
    image: "/assets/images/Men's Perfume/b31 Sky.png",
    category: "Men's Perfume",
    inspiredBy: 'D&G Light Blue',
  },
  {
    id: 49,
    name: 'Tsubasa',
    price: 335,
    image: "/assets/images/Men's Perfume/b32 Tsubasa.png",
    category: "Men's Perfume",
    inspiredBy: 'Lacoste Red',
  },
  {
    id: 50,
    name: 'Twilight',
    price: 345,
    image: "/assets/images/Men's Perfume/b33 Twilight.png",
    category: "Men's Perfume",
    inspiredBy: 'Dylan Blue',
    isNew: true,
  },
  {
    id: 51,
    name: 'UrbanScent',
    price: 300,
    image: "/assets/images/Men's Perfume/b34 UrbanScent.png",
    category: "Men's Perfume",
    inspiredBy: 'Ferrari Black',
  },
  {
    id: 52,
    name: 'Wild Pleasure',
    price: 355,
    image: "/assets/images/Men's Perfume/b35 Wild Pleasure.png",
    category: "Men's Perfume",
    inspiredBy: 'CK One',
  },
  {
    id: 53,
    name: 'Winter Blossom',
    price: 310,
    image: "/assets/images/Men's Perfume/b36 Winter Blossom.png",
    category: "Men's Perfume",
    inspiredBy: 'Ferrari Black',
  },
  {
    id: 54,
    name: 'Your King',
    price: 375,
    image: "/assets/images/Men's Perfume/b37 Your King.png",
    category: "Men's Perfume",
    inspiredBy: 'Swiss Army',
    isFeatured: true,
  },
  {
    id: 55,
    name: 'Zest',
    price: 285,
    image: "/assets/images/Men's Perfume/b38 Zest.png",
    category: "Men's Perfume",
    inspiredBy: 'Drakkar Noir',
  },
  {
    id: 56,
    name: 'Zoro',
    price: 330,
    image: "/assets/images/Men's Perfume/b39 Zoro.png",
    category: "Men's Perfume",
    inspiredBy: 'Creed Aventus',
  },
  {
    id: 57,
    name: 'Zynx',
    price: 315,
    image: "/assets/images/Men's Perfume/b40 Zynx.png",
    category: "Men's Perfume",
    inspiredBy: 'Hugo Boss Energise',
  },
  {
    id: 58,
    name: 'Chamber',
    price: 340,
    image: "/assets/images/Men's Perfume/b41 Chamber.png",
    category: "Men's Perfume",
    inspiredBy: 'Tommy Summer',
  },
  {
    id: 59,
    name: 'More Man',
    price: 325,
    image: "/assets/images/Men's Perfume/b42 More Man.png",
    category: "Men's Perfume",
    inspiredBy: 'Bleu De Chanel',
  },
  {
    id: 60,
    name: 'Wildest Howl',
    price: 360,
    image: "/assets/images/Men's Perfume/B43 Wildest Howl.png",
    category: "Men's Perfume",
    inspiredBy: 'Dior Sauvage',
    isNew: true,
  },
  {
    id: 61,
    name: 'Wonseok',
    price: 345,
    image: "/assets/images/Men's Perfume/B44 Wonseok.png",
    category: "Men's Perfume",
    inspiredBy: 'Black Mirror',
  },
  {
    id: 62,
    name: 'Hyunbin',
    price: 355,
    image: "/assets/images/Men's Perfume/B45 Hyunbin.png",
    category: "Men's Perfume",
    inspiredBy: 'Scuba Dive',
    isFeatured: true,
  },
  {
    id: 63,
    name: 'Bacani',
    price: 330,
    image: "/assets/images/Men's Perfume/B46 Bacani.png",
    category: "Men's Perfume",
    inspiredBy: 'Baccarat Rouge 540',
  },
  // Other Products
  {
    id: 13,
    name: 'Lavender Car Diffuser',
    price: 150,
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=500',
    category: 'Car Diffuser',
  },
  {
    id: 14,
    name: 'Ocean Breeze Car Diffuser',
    price: 180,
    image: 'https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=500',
    category: 'Car Diffuser',
    isNew: true,
  },
  {
    id: 15,
    name: 'Lemon Fresh Dish Washing Liquid',
    price: 85,
    image: 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=500',
    category: 'Dish Washing',
  },
  {
    id: 16,
    name: 'Antibacterial Hand Soap',
    price: 65,
    image: 'https://images.unsplash.com/photo-1584305574647-0cc949a2bb9f?w=500',
    category: 'Soap',
    isFeatured: true,
  },
  {
    id: 17,
    name: 'Moisturizing Liquid Soap',
    price: 75,
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500',
    category: 'Soap',
  },
  {
    id: 18,
    name: 'Premium Rubbing Alcohol 70%',
    price: 95,
    image: 'https://images.unsplash.com/photo-1584483766114-2cea6facdf57?w=500',
    category: 'Alcohol',
  },
  {
    id: 19,
    name: 'Isopropyl Alcohol 99%',
    price: 130,
    image: 'https://images.unsplash.com/photo-1584483766114-2cea6facdf57?w=500',
    category: 'Alcohol',
    isNew: true,
  },
  {
    id: 20,
    name: 'Fresh Mint Helmet Spray',
    price: 120,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500',
    category: 'Helmet Spray',
    isNew: true,
  },
  {
    id: 21,
    name: 'Antibacterial Helmet Spray',
    price: 140,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500',
    category: 'Helmet Spray',
  },
  {
    id: 22,
    name: 'Multi-Surface Disinfectant',
    price: 110,
    image: 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=500',
    category: 'Disinfectants',
    isFeatured: true,
  },
  {
    id: 23,
    name: 'Hospital Grade Disinfectant',
    price: 180,
    image: 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=500',
    category: 'Disinfectants',
  },
];

const defaultCategories = ['All', "Women's Perfume", "Men's Perfume", 'Car Diffuser', 'Dish Washing', 'Soap', 'Alcohol', 'Helmet Spray', 'Disinfectants'];
const sortOptions = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'name', label: 'Name: A-Z' },
];

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [allProducts, setAllProducts] = useState<ProductCardData[]>(defaultProducts);
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [categories, setCategories] = useState<string[]>(defaultCategories);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize search from URL param
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');
  
  // Initialize category from URL param, matching with categories array (case-insensitive)
  const getCategoryFromParam = useCallback((params: URLSearchParams) => {
    const param = params.get('category');
    if (!param) return 'All';
    const matched = categories.find(c => c.toLowerCase() === param.toLowerCase());
    return matched || 'All';
  }, [categories]);
  
  const [selectedCategory, setSelectedCategory] = useState(() => getCategoryFromParam(searchParams));
  const [sortBy, setSortBy] = useState('featured');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Fetch products from API on mount
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('Products.tsx: Fetching products from API...');
        const response = await productService.getProducts({ limit: 100 });
        console.log('Products.tsx: API Response:', response);
        
        if (response.success && response.data.length > 0) {
          const transformed = response.data.map(transformProduct);
          console.log('Products.tsx: Transformed products:', transformed.slice(0, 3));
          setAllProducts(transformed);
          
          // Extract categories from API response
          if (response.categories && response.categories.length > 0) {
            const categoryNames = ['All', ...response.categories.map((c: Category) => c.name)];
            setCategories(categoryNames);
          }
        } else if (!response.success) {
          console.warn('Products.tsx: API returned error, using fallback data:', response.error);
          setError(response.error || 'Failed to load products');
        }
      } catch (err: any) {
        console.error('Products.tsx: Fetch error:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProducts();
  }, []);

  // Update category and search when URL changes
  useEffect(() => {
    const newCategory = getCategoryFromParam(searchParams);
    if (newCategory !== selectedCategory) {
      setSelectedCategory(newCategory);
    }
    
    // Update search from URL
    const urlSearch = searchParams.get('search') || '';
    if (urlSearch !== searchQuery) {
      setSearchQuery(urlSearch);
    }
  }, [searchParams, selectedCategory, searchQuery, getCategoryFromParam]);

  // Filter and sort products (client-side for smooth UX)
  useEffect(() => {
    let filtered = [...allProducts];

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort products
    switch (sortBy) {
      case 'newest':
        filtered = filtered.filter((p) => p.isNew).concat(filtered.filter((p) => !p.isNew));
        break;
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'featured':
      default:
        filtered = filtered.filter((p) => p.isFeatured).concat(filtered.filter((p) => !p.isFeatured));
    }

    setProducts(filtered);
  }, [allProducts, selectedCategory, sortBy, searchQuery]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    if (category === 'All') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', category.toLowerCase());
    }
    setSearchParams(searchParams);
  };

  return (
    <div className="pt-16 sm:pt-20">
      {/* Page Header */}
      <section className="bg-black-950 py-8 sm:py-12 lg:py-16 px-4 sm:px-0">
        <div className="container-custom">
          <SectionHeader
            title="Our Products"
            subtitle="Explore our complete collection of premium fragrances and beauty essentials"
            dark
          />
        </div>
      </section>

      {/* Filters Bar */}
      <section className="sticky top-16 sm:top-20 z-40 bg-black-900 border-b border-gold-500/20 shadow-dark">
        <div className="container-custom py-3 sm:py-4 px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            {/* Left: Search on mobile */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full bg-black-800 border border-gold-500/30 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gold-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            
            {/* Right Actions */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Mobile Filter Toggle */}
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`md:hidden flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 border rounded-lg text-sm transition-colors ${
                  isFilterOpen ? 'border-gold-500 text-gold-500 bg-gold-500/10' : 'border-gold-500/30 text-white'
                }`}
              >
                <SlidersHorizontal size={16} />
                <span className="hidden xs:inline">Filters</span>
              </button>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 sm:px-4 py-2 sm:py-2.5 bg-black-800 border border-gold-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-gold-500 cursor-pointer min-w-0"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* View Toggle */}
              <div className="hidden sm:flex border border-gold-500/30 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 sm:p-2.5 transition-colors ${
                    viewMode === 'grid' ? 'bg-gold-500 text-black' : 'text-gray-400 hover:bg-black-800'
                  }`}
                >
                  <Grid3X3 size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 sm:p-2.5 transition-colors ${
                    viewMode === 'list' ? 'bg-gold-500 text-black' : 'text-gray-400 hover:bg-black-800'
                  }`}
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Category Tabs - Desktop */}
          <div className="hidden md:flex items-center gap-2 mt-4 overflow-x-auto scrollbar-hide pb-1">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-4 py-2 rounded-lg font-accent text-sm whitespace-nowrap transition-all ${
                  selectedCategory === category
                    ? 'bg-gold-500 text-black font-medium'
                    : 'bg-black-800 text-gray-300 hover:bg-black-700 hover:text-gold-400'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Mobile Filters */}
          {isFilterOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden mt-3 pt-3 border-t border-gold-500/20"
            >
              <p className="text-xs font-medium text-gray-400 mb-2">Category</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleCategoryChange(category)}
                    className={`px-3 py-1.5 rounded-lg font-accent text-xs transition-all ${
                      selectedCategory === category
                        ? 'bg-gold-500 text-black font-medium'
                        : 'bg-black-800 text-gray-300 active:bg-black-700'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-6 sm:py-8 lg:py-12 bg-black-900">
        <div className="container-custom px-4 sm:px-6">
          {/* Results Count */}
          <p className="text-gray-400 text-xs sm:text-sm mb-4 sm:mb-6">
            Showing {products.length} {products.length === 1 ? 'product' : 'products'}
            {selectedCategory !== 'All' && ` in ${selectedCategory}`}
          </p>

          {isLoading ? (
            <ProductGridSkeleton count={8} />
          ) : products.length === 0 ? (
            <div className="text-center py-12 sm:py-16">
              <p className="text-gray-500 text-base sm:text-lg mb-4">No products found</p>
              <Button onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className={`grid gap-3 sm:gap-4 lg:gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' 
                : 'grid-cols-1'
            }`}>
              {products.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Products;
