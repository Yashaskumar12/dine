import { db } from '../firebase';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import type { Restaurant as RestaurantType } from '../types';
import Restaurant from '../models/Restaurant';

export const createRestaurant = async (restaurantData: any) => {
  try {
    const restaurant = new Restaurant(restaurantData);
    await restaurant.save();
    return restaurant;
  } catch (error) {
    throw error;
  }
};

export const getAllRestaurants = async () => {
  try {
    const restaurants = await Restaurant.find();
    return restaurants;
  } catch (error) {
    throw error;
  }
};

export const getRestaurantById = async (id: string) => {
  try {
    const restaurant = await Restaurant.findById(id);
    return restaurant;
  } catch (error) {
    throw error;
  }
};

export const searchRestaurants = async (searchTerm: string) => {
  try {
    const restaurants = await Restaurant.find({
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { 'location.city': { $regex: searchTerm, $options: 'i' } },
        { 'location.state': { $regex: searchTerm, $options: 'i' } },
        { cuisine: { $regex: searchTerm, $options: 'i' } }
      ]
    });
    return restaurants;
  } catch (error) {
    throw error;
  }
};

export const updateRestaurant = async (id: string, updateData: any) => {
  try {
    const restaurant = await Restaurant.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true }
    );
    return restaurant;
  } catch (error) {
    throw error;
  }
};

export const getTotalGuestsForRestaurant = async (restaurantId: string): Promise<number> => {
  try {
    const bookingsRef = collection(db, 'bookings');
    const q = query(bookingsRef, where('restaurantId', '==', restaurantId));
    const querySnapshot = await getDocs(q);
    
    let totalGuests = 0;
    querySnapshot.forEach((doc) => {
      const booking = doc.data();
      totalGuests += booking.numberOfGuests || 0;
    });
    
    return totalGuests;
  } catch (error) {
    console.error('Error fetching total guests:', error);
    return 0;
  }
};

// Mock data for development
const mockRestaurants: RestaurantType[] = [
  {
    id: '1',
    name: 'Spice Garden',
    cuisine: ['Indian', 'North Indian'],
    address: 'MG Road, Bangalore',
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
    location: {
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India'
    },
    priceLevel: 3,
    openNow: true,
    phoneNumber: '+91-9876543210',
    menu: [
      {
        id: '1',
        name: 'Butter Chicken',
        description: 'Tender chicken in a rich, creamy tomato-based curry',
        price: 450,
        category: 'Main Course',
        image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398',
        isPopular: true
      },
      {
        id: '2',
        name: 'Paneer Tikka',
        description: 'Grilled cottage cheese marinated in spices',
        price: 350,
        category: 'Starters',
        image: 'https://i0.wp.com/cookingfromheart.com/wp-content/uploads/2017/03/Paneer-Tikka-Masala-4.jpg?fit=1024%2C683&ssl=1',
        isVegetarian: true,
        isPopular: true
      },
      {
        id: '3',
        name: 'Naan',
        description: 'Soft, fluffy bread baked in tandoor',
        price: 50,
        category: 'Breads',
        image: 'https://www.archanaskitchen.com/images/archanaskitchen/1-Author/Madhuli_Ajay/Butter_Garlic_Naan_Garlic_flavoured_leavened_Flat_bread_.jpg',
        isVegetarian: true
      },
      {
        id: '4',
        name: 'Veg Biryani',
        description: 'Fragrant basmati rice cooked with mixed vegetables and spices',
        price: 300,
        category: 'Main Course',
        image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8',
        isVegetarian: true
      },
      {
        id: '5',
        name: 'Chicken Tikka Masala',
        description: 'Grilled chicken in a spiced tomato and cream sauce',
        price: 400,
        category: 'Main Course',
        image: 'https://indisch-kochen.com/wp-content/uploads/2022/03/chicken-tikka-masala-haehnchen-tikka-masala.png',
        isPopular: true
      },
      {
        id: '6',
        name: 'Gulab Jamun',
        description: 'Sweet milk solids dumplings in sugar syrup',
        price: 150,
        category: 'Desserts',
        image: 'https://wallpapercave.com/wp/wp2157160.jpg',
        isVegetarian: true
      },
      {
        id: '7',
        name: 'Samosa',
        description: 'Crispy pastry filled with spiced potatoes and peas',
        price: 60,
        category: 'Starters',
        image: 'https://static.vecteezy.com/system/resources/previews/026/553/215/non_2x/samosa-in-the-kitchen-table-foodgraphy-ai-generated-photo.jpg',
        isVegetarian: true
      },
      {
        id: '8',
        name: 'Raita',
        description: 'Cooling yogurt with cucumber and mint',
        price: 80,
        category: 'Sides',
        image: 'https://www.vegrecipesofindia.com/wp-content/uploads/2016/10/masala-raita-recipe-1.jpg',
        isVegetarian: true
      },
      {
        id: '9',
        name: 'Masala Chai',
        description: 'Spiced Indian tea with milk',
        price: 40,
        category: 'Beverages',
        image: 'https://chaibag.com/cdn/shop/articles/masala-chai-tiramisu-recipe-a-fusion-of-indian-and-italian-242415.jpg?v=1689228510',
        isVegetarian: true
      },
      {
        id: '10',
        name: 'Mango Lassi',
        description: 'Sweet yogurt drink with mango',
        price: 100,
        category: 'Beverages',
        image: 'https://www.flavorquotient.com/wp-content/uploads/2023/05/Mango-Lassi-FQ-6-1036.jpg',
        isVegetarian: true
      },
      {
        id: '11',
        name: 'Tandoori Roti',
        description: 'Whole wheat bread baked in tandoor',
        price: 40,
        category: 'Breads',
        image: 'https://skydecklounge.in/wp-content/uploads/2022/01/Tandoori-Roti-Butter.jpg',
        isVegetarian: true
      },
      {
        id: '12',
        name: 'Chicken Curry',
        description: 'Chicken in a spiced onion-tomato gravy',
        price: 380,
        category: 'Main Course',
        image: 'https://vaya.in/recipes/wp-content/uploads/2019/02/Spicy-Malvani-Chicken-Curry.jpg'
      }
    ]
  },
  {
    id: '2',
    name: 'The Coastal Kitchen',
    cuisine: ['Seafood', 'Coastal'],
    address: 'Indiranagar, Bangalore',
    rating: 4.3,
    image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b',
    location: {
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India'
    },
    priceLevel: 2,
    openNow: true,
    phoneNumber: '+91-9876543211',
    menu: [
      {
        id: '1',
        name: 'Grilled Fish',
        description: 'Fresh fish marinated in coastal spices and grilled',
        price: 550,
        category: 'Main Course',
        image: 'https://www.licious.in/blog/wp-content/uploads/2020/12/Grilled-Fish.jpg',
        isPopular: true
      },
      {
        id: '2',
        name: 'Prawn Curry',
        description: 'Prawns in a coconut-based curry',
        price: 480,
        category: 'Main Course',
        image: 'https://tse3.mm.bing.net/th?id=OIP.-Aeuiz8Hfp76BAPUmxA2kwHaHa&pid=Api&P=0&h=180',
      },
      {
        id: '3',
        name: 'Fish Fry',
        description: 'Crispy fried fish with spices',
        price: 350,
        category: 'Starters',
        image: 'https://tse2.mm.bing.net/th?id=OIP.MeSmHhqyTFpK0qChnwK2AgHaHa&pid=Api&P=0&h=180'
      },
      {
        id: '4',
        name: 'Crab Masala',
        description: 'Spicy crab curry with coastal spices',
        price: 650,
        category: 'Main Course',
        image: 'https://tse2.mm.bing.net/th?id=OIP.K5-FLWI7hgw2QMhb9RDDLgHaFj&pid=Api&P=0&h=180',
        isPopular: true
      },
      {
        id: '5',
        name: 'Fish Biryani',
        description: 'Fragrant rice with fish and spices',
        price: 450,
        category: 'Main Course',
        image: 'https://tse1.mm.bing.net/th?id=OIP.JH0E_Tdm3jDDF-DPUZ9v-gHaGS&pid=Api&P=0&h=180'
      },
      {
        id: '6',
        name: 'Coconut Rice',
        description: 'Aromatic rice cooked with coconut',
        price: 200,
        category: 'Sides',
        image: 'https://tse2.mm.bing.net/th?id=OIP.hp9K63Wah1SNkcq4gRBKaQHaEo&pid=Api&P=0&h=180',
        isVegetarian: true
      },
      {
        id: '7',
        name: 'Fish Curry',
        description: 'Fish in a spicy coconut-based curry',
        price: 400,
        category: 'Main Course',
        image: 'https://tse4.mm.bing.net/th?id=OIP.nmeG-wvFhTbjpAZuAVSKcAHaE7&pid=Api&P=0&h=180'
      },
      {
        id: '8',
        name: 'Prawn Fry',
        description: 'Crispy fried prawns with spices',
        price: 450,
        category: 'Starters',
        image: 'https://tse2.mm.bing.net/th?id=OIP.P-kWM2BYLdeVbXpDEoPLxQHaE8&pid=Api&P=0&h=180'
      },
      {
        id: '9',
        name: 'Fish Cutlet',
        description: 'Spiced fish patties',
        price: 250,
        category: 'Starters',
        image: 'https://tse3.mm.bing.net/th?id=OIP.WoGpUhRFGiFnSDuNh1RnGgHaFf&pid=Api&P=0&h=180'
      },
      {
        id: '10',
        name: 'Coconut Water',
        description: 'Fresh coconut water',
        price: 80,
        category: 'Beverages',
        image: 'https://tse3.mm.bing.net/th?id=OIP.p40toVZb03XV2yXAsv-AcgHaEK&pid=Api&P=0&h=180',
        isVegetarian: true
      }
    ]
  },
  {
    id: '3',
    name: 'Biryani House',
    cuisine: ['Indian', 'Biryani'],
    address: 'Koramangala, Bangalore',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0',
    location: {
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India'
    },
    priceLevel: 2,
    openNow: true,
    phoneNumber: '+91-9876543212',
    menu: [
      {
        id: '1',
        name: 'Chicken Biryani',
        description: 'Fragrant basmati rice cooked with chicken and aromatic spices',
        price: 350,
        category: 'Main Course',
        image: 'https://tse2.mm.bing.net/th?id=OIP.2iWS4NJfB5y_mu30Nsq_bwHaHa&pid=Api&P=0&h=180',
        isPopular: true
      },
      {
        id: '2',
        name: 'Veg Biryani',
        description: 'Fragrant basmati rice cooked with mixed vegetables and spices',
        price: 250,
        category: 'Main Course',
        image: 'https://tse1.mm.bing.net/th?id=OIP.yh-lYonX_sPwlJA4vNQ6BAHaGL&pid=Api&P=0&h=180',
        isVegetarian: true
      },
      {
        id: '3',
        name: 'Mutton Biryani',
        description: 'Fragrant basmati rice cooked with tender mutton and spices',
        price: 400,
        category: 'Main Course',
        image: 'https://tse2.mm.bing.net/th?id=OIP.pK3hTwN_FIWMmNhocPG9tgHaHa&pid=Api&P=0&h=180',
        isPopular: true
      },
      {
        id: '4',
        name: 'Paneer Biryani',
        description: 'Fragrant basmati rice cooked with paneer and spices',
        price: 300,
        category: 'Main Course',
        image: 'https://tse4.mm.bing.net/th?id=OIP.pN0Gd1VrDd41FoaVd8IHRgHaLO&pid=Api&P=0&h=180',
        isVegetarian: true
      },
      {
        id: '5',
        name: 'Raita',
        description: 'Cooling yogurt with cucumber and mint',
        price: 80,
        category: 'Sides',
        image: 'https://tse3.mm.bing.net/th?id=OIP.tGKfUnzqb_qvATfxXvj2cgHaLH&pid=Api&P=0&h=180',
        isVegetarian: true
      },
      {
        id: '6',
        name: 'Mirchi Ka Salan',
        description: 'Spicy green chili curry',
        price: 120,
        category: 'Sides',
        image: 'https://tse2.mm.bing.net/th?id=OIP.uOg90jj6UjXTMY7skkENhwHaE8&pid=Api&P=0&h=180',
        isVegetarian: true
      },
      {
        id: '7',
        name: 'Kheer',
        description: 'Sweet rice pudding with nuts',
        price: 150,
        category: 'Desserts',
        image: 'https://tse3.mm.bing.net/th?id=OIP.Bt-RQa7CbwMV777FJjSEhAHaEK&pid=Api&P=0&h=180',
        isVegetarian: true
      },
      {
        id: '8',
        name: 'Masala Chai',
        description: 'Spiced Indian tea with milk',
        price: 40,
        category: 'Beverages',
        image: 'https://tse1.mm.bing.net/th?id=OIP.DsezVejWM0aVYNpLuN7JBQHaLG&pid=Api&P=0&h=180',
        isVegetarian: true
      }
    ]
  },
  {
    id: '4',
    name: 'Pizza Paradise',
    cuisine: ['Italian', 'Pizza'],
    address: 'Whitefield, Bangalore',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38',
    location: {
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India'
    },
    priceLevel: 2,
    openNow: true,
    phoneNumber: '+91-9876543213',
    menu: [
      {
        id: '1',
        name: 'Margherita Pizza',
        description: 'Classic pizza with tomato sauce and mozzarella',
        price: 350,
        category: 'Pizza',
        image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3',
        isVegetarian: true,
        isPopular: true
      },
      {
        id: '2',
        name: 'Pepperoni Pizza',
        description: 'Pizza topped with pepperoni and cheese',
        price: 450,
        category: 'Pizza',
        image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e',
        isPopular: true
      },
      {
        id: '3',
        name: 'Pasta Alfredo',
        description: 'Creamy pasta with parmesan sauce',
        price: 300,
        category: 'Pasta',
        image: 'https://tse3.mm.bing.net/th?id=OIP.9jqS4lZo9mC6mjPnXHQ4cwHaFj&pid=Api&P=0&h=180',
        isVegetarian: true
      },
      {
        id: '4',
        name: 'Garlic Bread',
        description: 'Toasted bread with garlic butter',
        price: 150,
        category: 'Sides',
        image: 'https://tse3.mm.bing.net/th?id=OIP.OcsnTuuKcYaB_5LkGhHmdQHaFj&pid=Api&P=0&h=180',
        isVegetarian: true
      },
      {
        id: '5',
        name: 'Caesar Salad',
        description: 'Fresh romaine lettuce with Caesar dressing',
        price: 250,
        category: 'Salads',
        image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9',
        isVegetarian: true
      },
      {
        id: '6',
        name: 'Tiramisu',
        description: 'Classic Italian dessert with coffee and mascarpone',
        price: 200,
        category: 'Desserts',
        image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9',
        isVegetarian: true
      },
      {
        id: '7',
        name: 'Mushroom Pizza',
        description: 'Pizza topped with mushrooms and cheese',
        price: 400,
        category: 'Pizza',
        image: 'https://images.unsplash.com/photo-1601924582970-9238bcb495d9',
        isVegetarian: true
      },
      {
        id: '8',
        name: 'Pasta Bolognese',
        description: 'Pasta with meat sauce',
        price: 350,
        category: 'Pasta',
        image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9'
      },
      {
        id: '9',
        name: 'Soft Drinks',
        description: 'Carbonated beverages',
        price: 80,
        category: 'Beverages',
        image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97',
        isVegetarian: true
      },
      {
        id: '10',
        name: 'Ice Cream',
        description: 'Vanilla ice cream with chocolate sauce',
        price: 150,
        category: 'Desserts',
        image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb',
        isVegetarian: true
      }
    ]
  },
  {
    id: '5',
    name: 'Sushi Master',
    cuisine: ['Japanese', 'Sushi'],
    address: 'UB City, Bangalore',
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c',
    location: {
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India'
    },
    priceLevel: 4,
    openNow: true,
    phoneNumber: '+91-9876543214',
    menu: [
      {
        id: '1',
        name: 'California Roll',
        description: 'Crab, avocado, and cucumber roll',
        price: 450,
        category: 'Sushi',
        image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351',
        isPopular: true
      },
      {
        id: '2',
        name: 'Salmon Nigiri',
        description: 'Fresh salmon over pressed sushi rice',
        price: 350,
        category: 'Sushi',
        image: 'https://images.unsplash.com/photo-1617196034183-421b4917c92d',
        isPopular: true
      },
      {
        id: '3',
        name: 'Miso Soup',
        description: 'Traditional Japanese soup with tofu',
        price: 150,
        category: 'Soups',
        image: 'https://tse4.mm.bing.net/th?id=OIP.DMGbYISswMMAKQr-pKriZAHaDt&pid=Api&P=0&h=180',
        isVegetarian: true
      },
      {
        id: '4',
        name: 'Tempura Roll',
        description: 'Shrimp tempura roll with spicy sauce',
        price: 500,
        category: 'Sushi',
        image: 'https://tse4.mm.bing.net/th?id=OIP.GFPGF-3T-FluBuMgdwCpkgHaE8&pid=Api&P=0&h=180'
      },
      {
        id: '5',
        name: 'Edamame',
        description: 'Steamed soybeans with sea salt',
        price: 200,
        category: 'Starters',
        image: 'https://tse1.mm.bing.net/th?id=OIP.D68BPmu0uKyCNgQG7RvOoQHaLH&pid=Api&P=0&h=180',
        isVegetarian: true
      },
      {
        id: '6',
        name: 'Ice Cream',
        description: 'Matcha-flavored ice cream',
        price: 250,
        category: 'Desserts',
        image: 'https://tse2.mm.bing.net/th?id=OIP.oTgRYULZOkr0kJqykSp5iwHaEK&pid=Api&P=0&h=180',
        isVegetarian: true
      },
      {
        id: '7',
        name: 'Dragon Roll',
        description: 'Tempura shrimp roll with avocado',
        price: 550,
        category: 'Sushi',
        image: 'https://tse3.mm.bing.net/th?id=OIP.epeYSZ-AR93r0RDkxUZkwgHaFj&pid=Api&P=0&h=180',
        isPopular: true
      },
      {
        id: '8',
        name: 'Sake',
        description: 'Japanese rice wine',
        price: 400,
        category: 'Beverages',
        image: 'https://tse4.mm.bing.net/th?id=OIP.k9XPXxEVBTWqcf61g5g5TAHaDt&pid=Api&P=0&h=180'
      },
      {
        id: '9',
        name: 'Vegetable Tempura',
        description: 'Assorted vegetables in tempura batter',
        price: 300,
        category: 'Starters',
        image: 'https://tse4.mm.bing.net/th?id=OIP.u2hssqUKe0ACtqW1V_5cHAHaES&pid=Api&P=0&h=180',
        isVegetarian: true
      },
      {
        id: '10',
        name: 'Green Tea',
        description: 'Traditional Japanese green tea',
        price: 100,
        category: 'Beverages',
        image: 'https://tse3.mm.bing.net/th?id=OIP.RYmprfFf2Lrj3_WZHQR7OAHaEO&pid=Api&P=0&h=180',
        isVegetarian: true
      }
    ]
  },
  {
    id: '6',
    name: 'Burger Junction',
    cuisine: ['American', 'Burgers'],
    address: 'Marathahalli, Bangalore',
    rating: 4.4,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd',
    location: {
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India'
    },
    priceLevel: 2,
    openNow: true,
    phoneNumber: '+91-9876543215',
    menu: [
      {
        id: '1',
        name: 'Classic Cheeseburger',
        description: 'Beef patty with cheese, lettuce, tomato, and special sauce',
        price: 250,
        category: 'Burgers',
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd',
        isPopular: true
      },
      {
        id: '2',
        name: 'Chicken Burger',
        description: 'Grilled chicken patty with lettuce and mayo',
        price: 220,
        category: 'Burgers',
        image: 'https://tse3.mm.bing.net/th?id=OIP.lhiIFT1BibZGXxqGrGUycQHaHa&pid=Api&P=0&h=180'
      },
      {
        id: '3',
        name: 'Veg Burger',
        description: 'Vegetable patty with lettuce and special sauce',
        price: 200,
        category: 'Burgers',
        image: 'https://tse3.mm.bing.net/th?id=OIP.mCUG88hVQotiSxdyXb847wHaEo&pid=Api&P=0&h=180',
        isVegetarian: true
      },
      {
        id: '4',
        name: 'French Fries',
        description: 'Crispy golden fries with seasoning',
        price: 100,
        category: 'Sides',
        image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877',
        isVegetarian: true
      },
      {
        id: '5',
        name: 'Onion Rings',
        description: 'Crispy battered onion rings',
        price: 120,
        category: 'Sides',
        image: 'https://tse4.mm.bing.net/th?id=OIP.3EqDCnYUSZZJXQrJjp0pJgHaE8&pid=Api&P=0&h=180',
        isVegetarian: true
      },
      {
        id: '6',
        name: 'Chocolate Milkshake',
        description: 'Creamy chocolate milkshake',
        price: 150,
        category: 'Beverages',
        image: 'https://images.unsplash.com/photo-1577805947697-89e18249d767',
        isVegetarian: true
      },
      {
        id: '7',
        name: 'Chicken Wings',
        description: 'Spicy fried chicken wings',
        price: 300,
        category: 'Starters',
        image: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f'
      },
      {
        id: '8',
        name: 'Soft Drinks',
        description: 'Carbonated beverages',
        price: 80,
        category: 'Beverages',
        image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97',
        isVegetarian: true
      },
      {
        id: '9',
        name: 'Ice Cream',
        description: 'Vanilla ice cream with chocolate sauce',
        price: 150,
        category: 'Desserts',
        image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb',
        isVegetarian: true
      },
      {
        id: '10',
        name: 'Chicken Nuggets',
        description: 'Crispy chicken nuggets with dipping sauce',
        price: 200,
        category: 'Starters',
        image: 'https://images.unsplash.com/photo-1562967914-608f82629710'
      }
    ]
  }
];

// Use this for development if Firebase is not set up
export const getMockRestaurantById = (id: string): RestaurantType | null => {
  return mockRestaurants.find(restaurant => restaurant.id === id) || null;
};

export const getMockTotalGuests = async (): Promise<number> => {
  return Math.floor(Math.random() * 100);
}; 