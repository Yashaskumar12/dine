import { db } from '../firebase';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import type { Restaurant } from '../types';
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
const mockRestaurants: Restaurant[] = [
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
        image: 'https://i.pinimg.com/736x/55/d2/e2/55d2e20b51b999decf2c35dbda69574a.jpg',
      },
      {
        id: '4',
        name: 'Crab Masala',
        description: 'Crab cooked in spicy masala',
        price: 650,
        category: 'Main Course',
        image: 'https://tse2.mm.bing.net/th?id=OIP.K5-FLWI7hgw2QMhb9RDDLgHaFj&pid=Api&P=0&h=180',
        isPopular: true
      },
      {
        id: '5',
        name: 'Seafood Platter',
        description: 'Assortment of grilled seafood',
        price: 1200,
        category: 'Main Course',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
        isPopular: true
      },
      {
        id: '6',
        name: 'Fish Biryani',
        description: 'Fragrant rice with fish and spices',
        price: 450,
        category: 'Main Course',
        image: 'https://tse3.mm.bing.net/th?id=OIP.Y9dF150pyuX6gLxA7eZOQwHaEK&pid=Api&P=0&h=180',
      },
      {
        id: '7',
        name: 'Calamari Rings',
        description: 'Crispy fried calamari',
        price: 380,
        category: 'Starters',
        image: 'https://tse3.mm.bing.net/th?id=OIP.xJcXcg5GGiCXeTa1wVCA8wHaGG&pid=Api&P=0&h=180',
      },
      {
        id: '8',
        name: 'Lobster Thermidor',
        description: 'Lobster in creamy sauce',
        price: 1800,
        category: 'Main Course',
        image: 'https://tse4.mm.bing.net/th?id=OIP.C1GDmBVSJvblnn3U7CdcgAHaFj&pid=Api&P=0&h=180',
        isPopular: true
      },
      {
        id: '9',
        name: 'Fish Curry',
        description: 'Fish in spicy coconut curry',
        price: 420,
        category: 'Main Course',
        image: 'https://tse2.mm.bing.net/th?id=OIP.WfUXLo8DaHhrp5B-pBNYPgHaE7&pid=Api&P=0&h=180',
      },
      {
        id: '10',
        name: 'Seafood Soup',
        description: 'Mixed seafood in clear broth',
        price: 280,
        category: 'Starters',
        image: 'https://tse1.mm.bing.net/th?id=OIP.ki6RT7H7rZUg_RsvIV_mYwHaFj&pid=Api&P=0&h=180',
      },
      {
        id: '11',
        name: 'Steamed Rice',
        description: 'Plain steamed rice',
        price: 100,
        category: 'Sides',
        image: 'https://tse4.mm.bing.net/th?id=OIP.mBRTgnKREa1qns4YvDwi6QHaE7&pid=Api&P=0&h=180',
        isVegetarian: true
      },
      {
        id: '12',
        name: 'Neer Dosa',
        description: 'Thin rice crepes',
        price: 120,
        category: 'Breads',
        image: 'https://tse3.mm.bing.net/th?id=OIP.BKFjGVGTlvPVCdopBayCGQHaE8&pid=Api&P=0&h=180',
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
    phoneNumber: '+91-9876543212'
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
    phoneNumber: '+91-9876543213'
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
    phoneNumber: '+91-9876543214'
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
    phoneNumber: '+91-9876543215'
  }
];

// Use this for development if Firebase is not set up
export const getMockRestaurantById = (id: string): Restaurant | null => {
  return mockRestaurants.find(restaurant => restaurant.id === id) || null;
};

export const getMockTotalGuests = async (): Promise<number> => {
  return Math.floor(Math.random() * 100);
}; 