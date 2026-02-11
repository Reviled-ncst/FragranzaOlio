-- Fragranza Olio - Products Database Schema
-- Run this in Supabase SQL Editor

-- =====================================================
-- CATEGORIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    parent_id INTEGER REFERENCES public.categories(id),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PRODUCTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,
    description TEXT,
    short_description VARCHAR(500),
    category_id INTEGER REFERENCES public.categories(id),
    price DECIMAL(10,2) NOT NULL,
    compare_price DECIMAL(10,2), -- Original price for sale display
    cost_price DECIMAL(10,2), -- For inventory/finance
    sku VARCHAR(50) UNIQUE,
    barcode VARCHAR(50),
    
    -- Images
    image_main TEXT,
    image_gallery TEXT[], -- Array of image URLs
    
    -- Product details
    volume VARCHAR(50), -- e.g., "50ml", "100ml"
    concentration VARCHAR(50), -- e.g., "Eau de Parfum", "Eau de Toilette"
    ingredients TEXT,
    notes_top TEXT,
    notes_middle TEXT,
    notes_base TEXT,
    
    -- Inventory
    stock_quantity INTEGER DEFAULT 0,
    stock_status VARCHAR(20) DEFAULT 'in_stock' CHECK (stock_status IN ('in_stock', 'out_of_stock', 'low_stock', 'coming_soon')),
    low_stock_threshold INTEGER DEFAULT 10,
    
    -- Flags
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_new BOOLEAN DEFAULT FALSE,
    is_on_sale BOOLEAN DEFAULT FALSE,
    
    -- SEO
    meta_title VARCHAR(200),
    meta_description VARCHAR(500),
    
    -- Stats
    rating DECIMAL(3,2) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    sold_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Categories: Everyone can view active categories
CREATE POLICY "Anyone can view active categories" ON public.categories
    FOR SELECT USING (is_active = TRUE);

-- Products: Everyone can view active products
CREATE POLICY "Anyone can view active products" ON public.products
    FOR SELECT USING (is_active = TRUE);

-- Admin/Inventory can manage products (needs auth check)
CREATE POLICY "Staff can manage products" ON public.products
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM public.profiles 
            WHERE role IN ('admin', 'inventory', 'sales')
        )
    );

CREATE POLICY "Staff can manage categories" ON public.categories
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM public.profiles 
            WHERE role IN ('admin', 'inventory')
        )
    );

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_new ON public.products(is_new) WHERE is_new = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);

-- =====================================================
-- AUTO-UPDATE TRIGGER
-- =====================================================
DROP TRIGGER IF EXISTS on_products_updated ON public.products;
CREATE TRIGGER on_products_updated
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_categories_updated ON public.categories;
CREATE TRIGGER on_categories_updated
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- SAMPLE CATEGORIES
-- =====================================================
INSERT INTO public.categories (name, slug, description, sort_order) VALUES
    ('Women''s Perfume', 'womens-perfume', 'Elegant fragrances for women', 1),
    ('Men''s Perfume', 'mens-perfume', 'Sophisticated scents for men', 2),
    ('Car Diffuser', 'car-diffuser', 'Premium car air fresheners', 3),
    ('Dish Washing', 'dish-washing', 'Scented dish washing liquids', 4),
    ('Soap', 'soap', 'Luxurious scented soaps', 5),
    ('Alcohol', 'alcohol', 'Scented sanitizing alcohol', 6),
    ('Helmet Spray', 'helmet-spray', 'Fresh helmet deodorizers', 7),
    ('Disinfectants', 'disinfectants', 'Scented disinfectant products', 8)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- SAMPLE PRODUCTS
-- =====================================================
INSERT INTO public.products (name, slug, category_id, price, image_main, volume, concentration, stock_quantity, is_featured, is_new, short_description) VALUES
    -- Women's Perfumes
    ('Blossom', 'blossom', 1, 380, '/assets/images/Women''s Perfume/G1 Blossom.png', '50ml', 'Eau de Parfum', 100, TRUE, TRUE, 'A delicate floral fragrance with notes of rose and jasmine'),
    ('Aurora', 'aurora', 1, 420, '/assets/images/Women''s Perfume/G3 Aurora.png', '50ml', 'Eau de Parfum', 85, TRUE, FALSE, 'Radiant and uplifting with citrus and vanilla notes'),
    ('Beatrice', 'beatrice', 1, 395, '/assets/images/Women''s Perfume/G4 Beatrice.png', '50ml', 'Eau de Parfum', 92, FALSE, TRUE, 'Elegant and sophisticated with amber undertones'),
    ('Behind Scent', 'behind-scent', 1, 350, '/assets/images/Women''s Perfume/G5 Behind Scent.png', '50ml', 'Eau de Parfum', 120, FALSE, FALSE, 'Mysterious and alluring evening fragrance'),
    ('Bella', 'bella', 1, 365, '/assets/images/Women''s Perfume/G6 Bella.png', '50ml', 'Eau de Parfum', 78, TRUE, FALSE, 'Sweet and feminine with fruity notes'),
    ('Berry Wine', 'berry-wine', 1, 340, '/assets/images/Women''s Perfume/G7 Berry Wine.png', '50ml', 'Eau de Parfum', 95, FALSE, FALSE, 'Rich and warm with berry and wine accords'),
    ('Blue Heart', 'blue-heart', 1, 385, '/assets/images/Women''s Perfume/G8 Blue Heart.png', '50ml', 'Eau de Parfum', 88, FALSE, TRUE, 'Fresh and aquatic with ocean-inspired notes'),
    ('Choco Tart', 'choco-tart', 1, 355, '/assets/images/Women''s Perfume/G9 Choco Tart.png', '50ml', 'Eau de Parfum', 65, FALSE, FALSE, 'Gourmand fragrance with chocolate and caramel'),
    ('Chloe', 'chloe', 1, 410, '/assets/images/Women''s Perfume/G10 Chloe.png', '50ml', 'Eau de Parfum', 72, TRUE, FALSE, 'Classic and timeless floral bouquet'),
    ('Cotton Love', 'cotton-love', 1, 360, '/assets/images/Women''s Perfume/G11 Cotton Love.png', '50ml', 'Eau de Parfum', 110, FALSE, FALSE, 'Clean and fresh like fresh laundry'),
    
    -- Men's Perfumes
    ('Bleu Royale', 'bleu-royale', 2, 450, '/assets/images/Men''s Perfume/B1 Bleu Royale.png', '50ml', 'Eau de Parfum', 80, TRUE, TRUE, 'Regal and commanding masculine scent'),
    ('Dark Knight', 'dark-knight', 2, 420, '/assets/images/Men''s Perfume/B2 Dark Knight.png', '50ml', 'Eau de Parfum', 90, TRUE, FALSE, 'Bold and mysterious with leather notes'),
    ('Ocean Breeze', 'ocean-breeze', 2, 380, '/assets/images/Men''s Perfume/B3 Ocean Breeze.png', '50ml', 'Eau de Toilette', 115, FALSE, TRUE, 'Fresh aquatic scent for everyday wear'),
    ('Gentleman', 'gentleman', 2, 400, '/assets/images/Men''s Perfume/B4 Gentleman.png', '50ml', 'Eau de Parfum', 75, TRUE, FALSE, 'Sophisticated and refined for the modern man'),
    
    -- Car Diffusers
    ('Fresh Pine', 'fresh-pine', 3, 180, '/assets/images/Car Diffuser/CD1 Fresh Pine.png', '10ml', 'Essential Oil', 200, TRUE, FALSE, 'Refreshing pine forest scent'),
    ('Ocean Mist', 'ocean-mist', 3, 180, '/assets/images/Car Diffuser/CD2 Ocean Mist.png', '10ml', 'Essential Oil', 185, FALSE, TRUE, 'Cool ocean breeze fragrance'),
    
    -- Soaps
    ('Lavender Dream', 'lavender-dream', 5, 95, '/assets/images/Soap/S1 Lavender Dream.png', '100g', 'Bar Soap', 300, TRUE, FALSE, 'Calming lavender scented soap'),
    ('Citrus Burst', 'citrus-burst', 5, 95, '/assets/images/Soap/S2 Citrus Burst.png', '100g', 'Bar Soap', 280, FALSE, TRUE, 'Energizing citrus soap')
ON CONFLICT (slug) DO NOTHING;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.categories TO authenticated;
GRANT ALL ON public.products TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

SELECT 'Products schema created successfully!' as result;
