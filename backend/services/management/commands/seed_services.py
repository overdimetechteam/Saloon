from django.core.management.base import BaseCommand
from services.models import Service

SERVICES = [
    # ── HAIR ──────────────────────────────────────────────────────────────────
    ('Hair', 'Haircut (Women)',            'A professional cut and style tailored to the client\'s desired length and shape.'),
    ('Hair', 'Haircut (Men)',              'A clean precision cut shaped to the client\'s preferred style.'),
    ('Hair', 'Haircut (Kids)',             'A gentle and quick cut suitable for children under 12.'),
    ('Hair', 'Haircut & Blow Dry',         'A full cut followed by a professional blow dry and finish.'),
    ('Hair', 'Fringe / Bangs Trim',        'A quick trim to neaten and reshape the fringe or bangs area.'),
    ('Hair', 'Beard Trim',                 'A precise trim and shaping of the beard to the client\'s desired style.'),
    ('Hair', 'Haircut & Beard Combo',      'A combined haircut and beard trim service for a complete groomed look.'),
    ('Hair', 'Head Shave',                 'A smooth full head shave using clippers and razor for a clean finish.'),
    ('Hair', 'Shape Up / Line Up',         'A clean edge lineup along the hairline, temples, and neckline.'),
    ('Hair', 'Low Fade',                   'A gradual fade starting low near the ears and neckline blending into the style.'),
    ('Hair', 'Mid Fade',                   'A fade that begins at the mid level of the head for a sharp blended look.'),
    ('Hair', 'High Fade',                  'A dramatic fade starting high on the sides for a bold modern style.'),
    ('Hair', 'Undercut',                   'The sides and back are cut very short or shaved while the top remains long.'),
    ('Hair', 'Buzz Cut',                   'An even all-over cut using clippers at a uniform short length.'),
    ('Hair', 'Full Hair Color',            'Full application of permanent or semi-permanent color to all of the hair.'),
    ('Hair', 'Root Touch Up',              'Color applied only to the regrowth at the roots to match existing color.'),
    ('Hair', 'Full Highlights',            'Lightening foils applied throughout the entire head for a bright dimensional look.'),
    ('Hair', 'Partial Highlights',         'Highlights applied to the top and front sections only for a subtle effect.'),
    ('Hair', 'Balayage',                   'A freehand painting technique that creates a natural sun-kissed gradient effect.'),
    ('Hair', 'Ombre',                      'A gradient color effect transitioning from dark roots to lighter ends.'),
    ('Hair', 'Hair Bleaching',             'Full lightening of the hair using bleach as a base for vivid or platinum color.'),
    ('Hair', 'Toning',                     'A gloss or toner applied after bleaching to neutralize brassiness and refine color.'),
    ('Hair', 'Gray Coverage',              'Full color application specifically formulated to cover gray and white hair.'),
    ('Hair', 'Deep Conditioning Treatment','An intensive moisture treatment applied with heat to repair and hydrate the hair.'),
    ('Hair', 'Keratin Treatment',          'A smoothing treatment that eliminates frizz and leaves hair straight and shiny for months.'),
    ('Hair', 'Protein Treatment',          'A strengthening treatment that rebuilds damaged hair structure from within.'),
    ('Hair', 'Scalp Treatment',            'A targeted treatment to address scalp issues such as dryness, dandruff, or oiliness.'),
    ('Hair', 'Hair Botox Treatment',       'A deep conditioning filler treatment that restores elasticity and smoothness to the hair.'),
    ('Hair', 'Olaplex Treatment',          'A bond-rebuilding treatment that repairs broken disulfide bonds caused by chemical damage.'),
    ('Hair', 'Blow Dry & Style',           'A professional blow dry using round brush techniques for a smooth voluminous finish.'),
    ('Hair', 'Hair Straightening (Flat Iron)', 'Temporary straightening of the hair using a flat iron for a sleek look.'),
    ('Hair', 'Curling & Waves',            'Styling using curling tongs or wand to create defined curls or soft waves.'),
    ('Hair', 'Updo / Formal Style',        'An elegant pinned or twisted upstyle suitable for formal occasions and events.'),
    ('Hair', 'Bridal Hair',                'A full bridal hairstyle including trial consultation, pinning, and finishing.'),
    ('Hair', 'Box Braids',                 'Individual plaited extensions sectioned into box-shaped parts across the scalp.'),
    ('Hair', 'French Braid',               'A classic three-strand braid woven close to the scalp from crown to nape.'),
    ('Hair', 'Cornrows',                   'Tight flat braids styled in straight or curved rows directly on the scalp.'),
    ('Hair', 'Perm (Wavy / Curly)',        'A chemical process that permanently restructures the hair into waves or curls.'),
    ('Hair', 'Digital Perm',               'A heat-assisted perm using digital rods to create soft natural-looking curls.'),
    ('Hair', 'Hair Relaxer',               'A chemical treatment that permanently straightens naturally curly or coily hair.'),
    ('Hair', 'Head & Scalp Massage',       'A relaxing manual massage of the scalp to stimulate circulation and relieve tension.'),

    # ── NAILS ─────────────────────────────────────────────────────────────────
    ('Nails', 'Basic Manicure',            'Filing, shaping, cuticle care, and a classic polish application on the hands.'),
    ('Nails', 'Spa Manicure',              'An extended manicure with exfoliation, mask, and hand massage for deep care.'),
    ('Nails', 'French Manicure',           'A classic look with natural pink base and clean white tips on the nails.'),
    ('Nails', 'Gel Manicure',              'A long-lasting manicure using UV-cured gel polish that resists chips for weeks.'),
    ('Nails', 'Acrylic Manicure',          'Hard acrylic extensions applied over natural nails for added length and strength.'),
    ('Nails', 'Dip Powder Manicure',       'A durable color system where nails are dipped into colored powder and sealed.'),
    ('Nails', 'Paraffin Manicure',         'A manicure enhanced with warm paraffin wax dip to soften and moisturize hands.'),
    ('Nails', 'Nail Art (Simple)',          'Basic nail art designs such as dots, lines, or simple patterns on finished nails.'),
    ('Nails', 'Nail Art (Complex)',         'Detailed hand-painted or 3D nail art designs requiring advanced technique.'),
    ('Nails', 'Nail Extensions (Gel Tips)', 'Gel-based extensions that add length and are shaped and finished to preference.'),
    ('Nails', 'Gel / Acrylic Removal',     'Safe removal of existing gel or acrylic product with nail conditioning after.'),
    ('Nails', 'Nail Repair (Per Nail)',     'Repair of a single broken or damaged nail using gel or acrylic.'),
    ('Nails', 'Polish Change (Hands)',      'Removal of old polish and fresh application of chosen nail color on hands.'),
    ('Nails', 'Nail Strengthening Treatment', 'A fortifying treatment applied to brittle or weak nails to improve resilience.'),
    ('Nails', 'Basic Pedicure',            'Soaking, filing, shaping, cuticle care, and polish application on the feet.'),
    ('Nails', 'Spa Pedicure',              'An extended pedicure with scrub, mask, and foot massage for full relaxation.'),
    ('Nails', 'Gel Pedicure',              'A long-lasting pedicure using UV-cured gel polish on the toenails.'),
    ('Nails', 'French Pedicure',           'A classic natural look with white tips applied on the toenails.'),
    ('Nails', 'Paraffin Pedicure',         'A pedicure with warm paraffin wax treatment to deeply soften and heal dry feet.'),
    ('Nails', 'Callus Removal',            'Professional removal of hard skin and calluses from the heels and soles.'),
    ('Nails', 'Foot Scrub & Massage',      'An exfoliating foot scrub followed by a relaxing massage with moisturizing cream.'),
    ('Nails', 'Polish Change (Toes)',       'Removal of old polish and fresh application of chosen nail color on toes.'),
    ('Nails', 'Nail Art (Toes)',            'Decorative nail art designs applied to toenails after pedicure.'),

    # ── SKIN ──────────────────────────────────────────────────────────────────
    ('Skin', 'Basic Facial',               'A classic cleanse, tone, and moisturize facial suitable for all skin types.'),
    ('Skin', 'Deep Cleansing Facial',      'A thorough facial targeting clogged pores, blackheads, and surface impurities.'),
    ('Skin', 'Hydrating Facial',           'An intensive moisture-boosting facial to restore radiance to dry and dull skin.'),
    ('Skin', 'Anti-Aging Facial',          'A treatment targeting fine lines, wrinkles, and loss of firmness using active serums.'),
    ('Skin', 'Brightening Facial',         'A vitamin C and enzyme treatment to even skin tone and reduce dark spots.'),
    ('Skin', 'Acne Treatment Facial',      'A targeted facial to reduce active breakouts, control oil, and calm inflamed skin.'),
    ('Skin', 'Gold Facial',                'A luxurious facial using gold-infused products to brighten and firm the skin.'),
    ('Skin', 'Charcoal Facial',            'A detoxifying facial using activated charcoal to draw out impurities and tighten pores.'),
    ('Skin', 'Fruit Facial',               'A natural facial using fruit enzyme masks to gently exfoliate and refresh the skin.'),
    ('Skin', 'Bridal Glow Facial',         'A multi-step brightening and plumping facial designed to give brides radiant skin.'),
    ('Skin', 'Chemical Peel (Light)',       'A mild acid exfoliation that removes dead skin cells and improves skin texture.'),
    ('Skin', 'Microdermabrasion',          'A mechanical exfoliation treatment that buffs away the outer layer of dead skin.'),
    ('Skin', 'LED Light Therapy',          'A non-invasive light treatment targeting acne, aging, or redness depending on wavelength.'),
    ('Skin', 'Blackhead Extraction',       'Manual or tool-assisted removal of blackheads and comedones from the face.'),
    ('Skin', 'Eyebrow Threading',          'Precise hair removal using a twisted thread to shape and define the eyebrows.'),
    ('Skin', 'Eyebrow Waxing',             'Wax applied to the brow area to remove unwanted hair and define the arch.'),
    ('Skin', 'Eyebrow Tinting',            'Semi-permanent dye applied to the brows to enhance their color and definition.'),
    ('Skin', 'Eyebrow Lamination',         'A brow perm treatment that brushes hairs upward for a full fluffy defined look.'),
    ('Skin', 'Eyelash Tinting',            'Semi-permanent dye applied to the lashes to darken and define without mascara.'),
    ('Skin', 'Eyelash Lift & Perm',        'A semi-permanent curl treatment that lifts natural lashes upward for an open-eye effect.'),
    ('Skin', 'Eyelash Extensions (Classic)', 'Individual synthetic lashes applied one-to-one to natural lashes for length and curl.'),
    ('Skin', 'Eyelash Extensions (Volume)', 'Multiple lightweight lash fans applied per natural lash for a fuller dramatic look.'),
    ('Skin', 'Upper Lip Threading',        'Hair removal using thread along the upper lip area for a clean finish.'),
    ('Skin', 'Full Face Threading',        'Complete facial hair removal by threading covering brows, upper lip, chin, and cheeks.'),
    ('Skin', 'Hot Towel Shave',            'A traditional wet shave with hot towel preparation and straight razor for men.'),
    ('Skin', 'Beard Shaping & Styling',    'Detailed beard sculpting and definition using clippers, razor, and finishing products.'),
    ('Skin', 'Men\'s Facial',              'A facial specifically formulated for men\'s skin targeting oiliness, pores, and roughness.'),
    ('Skin', 'Face Scrub (Men)',            'A deep exfoliating scrub treatment for men to remove dead skin and freshen the complexion.'),
    ('Skin', 'Swedish Massage',            'A full body relaxation massage using long smooth strokes to ease muscle tension.'),
    ('Skin', 'Deep Tissue Massage',        'A firm pressure massage targeting deep muscle layers to relieve chronic tension.'),
    ('Skin', 'Aromatherapy Massage',       'A relaxing massage using essential oil blends chosen for their therapeutic properties.'),
    ('Skin', 'Hot Stone Massage',          'Smooth heated basalt stones are used alongside massage to deeply relax the muscles.'),
    ('Skin', 'Shoulder & Neck Massage',    'A focused massage targeting tension in the shoulders, neck, and upper back area.'),
    ('Skin', 'Full Body Scrub',            'An all-over exfoliation treatment using scrub or salt to remove dead skin cells.'),
    ('Skin', 'Body Wrap',                  'A detoxifying or hydrating wrap applied to the full body and left to absorb.'),
    ('Skin', 'Foot Reflexology',           'Targeted pressure applied to specific points on the feet linked to body organs.'),
    ('Skin', 'Underarm Waxing',            'Wax applied to the underarm area for smooth clean hair removal.'),
    ('Skin', 'Full Leg Waxing',            'Wax applied from ankle to upper thigh for complete leg hair removal.'),
    ('Skin', 'Half Leg Waxing',            'Wax applied from ankle to knee for lower leg hair removal.'),
    ('Skin', 'Full Arm Waxing',            'Wax applied from wrist to shoulder for complete arm hair removal.'),
    ('Skin', 'Bikini Wax',                 'Wax applied along the bikini line to remove unwanted hair neatly.'),
    ('Skin', 'Brazilian Wax',              'Full removal of hair in the bikini area front and back leaving skin completely smooth.'),
    ('Skin', 'Back Waxing',                'Wax applied to the full back area for clean hair removal, popular with men.'),
    ('Skin', 'Chest Waxing',               'Wax applied to the chest area for smooth hair removal, popular with men.'),

    # ── MAKEUP ────────────────────────────────────────────────────────────────
    ('Makeup', 'Day Makeup',               'A light natural makeup look suitable for daytime events and everyday occasions.'),
    ('Makeup', 'Evening / Party Makeup',   'A more dramatic and polished makeup look designed for night events and parties.'),
    ('Makeup', 'Bridal Makeup (Trial)',     'A full trial run of the bridal makeup look done ahead of the wedding day.'),
    ('Makeup', 'Bridal Makeup (Wedding Day)', 'The complete bridal makeup application on the wedding day including touch-up kit.'),
    ('Makeup', 'Engagement Makeup',        'A glowing and elegant makeup look tailored for engagement photoshoots and ceremonies.'),
    ('Makeup', 'Photoshoot / Editorial Makeup', 'Creative and camera-ready makeup designed for professional photo or video shoots.'),
    ('Makeup', 'Airbrush Makeup',          'Foundation and coverage applied using an airbrush gun for a flawless seamless finish.'),
    ('Makeup', 'Contouring & Highlighting', 'Sculpting the face using light and shadow techniques to define and enhance features.'),
    ('Makeup', 'Makeup Lesson',            'A one-on-one tutorial teaching the client techniques suited to their features and lifestyle.'),
    ('Makeup', 'Strip Lash Application',   'Application of false strip lashes to enhance eye shape and add drama to any look.'),
    ('Makeup', 'Microblading',             'A semi-permanent tattoo technique using fine strokes to create realistic brow hairs.'),
    ('Makeup', 'Lip Blush',                'A semi-permanent lip tint tattoo that enhances the natural lip color and shape.'),
    ('Makeup', 'Semi-Permanent Eyeliner',  'A tattooed eyeliner applied along the lash line for lasting definition without daily makeup.'),
]


class Command(BaseCommand):
    help = 'Seed the database with the platform service catalogue.'

    def handle(self, *args, **options):
        created = 0
        existed = 0

        for category, name, description in SERVICES:
            _, was_created = Service.objects.get_or_create(
                name=name,
                category=category,
                defaults={
                    'description': description,
                    'default_duration_minutes': 0,
                    'default_price': 0,
                    'is_active': True,
                    'is_private': False,
                    'owner_salon': None,
                },
            )
            if was_created:
                created += 1
            else:
                existed += 1

        total = Service.objects.count()
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(f'Services created:        {created}'))
        self.stdout.write(self.style.WARNING(f'Services already existed: {existed}'))
        self.stdout.write(self.style.SUCCESS(f'Total services in database: {total}'))
