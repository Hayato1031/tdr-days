// Simple in-memory storage for daily greeting
let dailyGreetingCache: { date: string; greeting: CastGreeting | null; isDefault: boolean } | null = null;

export interface CastGreeting {
  text: string;
  area: string;
  park: 'TDL' | 'TDS';
  language: string;
  meaning?: string;
}

export const CAST_GREETINGS: CastGreeting[] = [
  // Tokyo Disneyland
  { text: 'ハウディー', area: 'ウエスタンランド', park: 'TDL', language: 'English (訛り)', meaning: 'こんにちは、ごきげんよう' },
  { text: 'ハウディドゥー', area: 'クリッターカントリー', park: 'TDL', language: 'English (南部訛り)', meaning: 'ハウディーの南部訛り' },
  { text: 'ボンジュール', area: 'ニューファンタジーランド', park: 'TDL', language: 'French', meaning: 'こんにちは（フランス語）' },
  
  // Tokyo DisneySea
  { text: 'ボンジョルノ', area: 'メディテレーニアンハーバー', park: 'TDS', language: 'Italian', meaning: 'こんにちは（イタリア語）' },
  { text: 'ボナセーラ', area: 'メディテレーニアンハーバー', park: 'TDS', language: 'Italian', meaning: 'こんばんは（イタリア語）' },
  { text: 'グラッチェ', area: 'メディテレーニアンハーバー', park: 'TDS', language: 'Italian', meaning: 'ありがとう（イタリア語）' },
  { text: 'チャオ', area: 'メディテレーニアンハーバー', park: 'TDS', language: 'Italian', meaning: 'やあ（イタリア語）' },
  { text: 'アリベデルチ', area: 'メディテレーニアンハーバー', park: 'TDS', language: 'Italian', meaning: 'さようなら（イタリア語）' },
  
  { text: 'グッドアフタヌーン', area: 'アメリカンウォーターフロント', park: 'TDS', language: 'English', meaning: 'こんにちは' },
  { text: 'グッド・デイ', area: 'アメリカンウォーターフロント', park: 'TDS', language: 'English', meaning: 'こんにちは' },
  { text: 'グッドイブニング', area: 'アメリカンウォーターフロント', park: 'TDS', language: 'English', meaning: 'こんばんは' },
  
  { text: 'ブエノスディアス', area: 'ロストリバーデルタ', park: 'TDS', language: 'Spanish', meaning: 'おはよう（スペイン語）' },
  { text: 'ブエナスタルデス', area: 'ロストリバーデルタ', park: 'TDS', language: 'Spanish', meaning: 'こんにちは（スペイン語）' },
  { text: 'ブエナスノチェス', area: 'ロストリバーデルタ', park: 'TDS', language: 'Spanish', meaning: 'こんばんは（スペイン語）' },
  { text: 'オラ', area: 'ロストリバーデルタ', park: 'TDS', language: 'Spanish', meaning: 'やあ（スペイン語）' },
  { text: 'グラシアス', area: 'ロストリバーデルタ', park: 'TDS', language: 'Spanish', meaning: 'ありがとう（スペイン語）' },
  { text: 'アミーゴス', area: 'ロストリバーデルタ', park: 'TDS', language: 'Spanish', meaning: '友達（スペイン語）' },
  
  { text: 'サラーム', area: 'アラビアンコースト', park: 'TDS', language: 'Arabic', meaning: 'あなた達の上に平安あれ' },
  { text: 'アハラン・ワ・サハラン', area: 'アラビアンコースト', park: 'TDS', language: 'Arabic', meaning: 'ようこそ（アラビア語）' },
  { text: 'シュクラン', area: 'アラビアンコースト', park: 'TDS', language: 'Arabic', meaning: 'ありがとう（アラビア語）' },
  
  { text: 'モビリス', area: 'ミステリアスアイランド', park: 'TDS', language: 'Latin', meaning: '変化をもって変化する' },
];

interface DailyGreeting {
  date: string;
  greeting: CastGreeting | null;
  isDefault: boolean;
}

export const getDailyGreeting = async (): Promise<{ text: string; area?: string; isSpecial: boolean }> => {
  try {
    const today = new Date().toDateString(); // Get current date as string
    
    // Check if we need to generate a new greeting for today
    if (!dailyGreetingCache || dailyGreetingCache.date !== today) {
      // Generate new greeting with 80% chance of default, 20% chance of cast greeting
      const random = Math.random();
      console.log('getDailyGreeting - Random value:', random); // Debug log
      
      if (random < 0.8) {
        // 80% chance - use default "ようこそ"
        console.log('getDailyGreeting - Selected default greeting'); // Debug log
        dailyGreetingCache = {
          date: today,
          greeting: null,
          isDefault: true,
        };
      } else {
        // 20% chance - use random cast greeting
        const randomIndex = Math.floor(Math.random() * CAST_GREETINGS.length);
        const selectedGreeting = CAST_GREETINGS[randomIndex];
        console.log('getDailyGreeting - Selected cast greeting:', selectedGreeting); // Debug log
        dailyGreetingCache = {
          date: today,
          greeting: selectedGreeting,
          isDefault: false,
        };
      }
    }
    
    console.log('getDailyGreeting - Final greeting cache:', dailyGreetingCache); // Debug log
    
    if (dailyGreetingCache.isDefault) {
      console.log('getDailyGreeting - Returning default greeting'); // Debug log
      return {
        text: 'ようこそ',
        isSpecial: false,
      };
    } else {
      console.log('getDailyGreeting - Returning special greeting:', dailyGreetingCache.greeting); // Debug log
      return {
        text: dailyGreetingCache.greeting!.text,
        area: `${dailyGreetingCache.greeting!.area} (${dailyGreetingCache.greeting!.park})`,
        isSpecial: true,
      };
    }
  } catch (error) {
    console.error('Error getting daily greeting:', error);
    // Fallback to default
    return {
      text: 'ようこそ',
      isSpecial: false,
    };
  }
};

// Function to manually reset greeting (for testing purposes)
export const resetDailyGreeting = async (): Promise<void> => {
  try {
    dailyGreetingCache = null;
    console.log('Greeting cache reset'); // Debug log
  } catch (error) {
    console.error('Error resetting daily greeting:', error);
  }
};

// Function to force a new greeting (for testing)
export const getNewRandomGreeting = async (): Promise<{ text: string; area?: string; isSpecial: boolean }> => {
  try {
    // Generate new greeting with 80% chance of default, 20% chance of cast greeting
    const random = Math.random();
    console.log('getNewRandomGreeting - Random value:', random); // Debug log
    
    if (random < 0.8) {
      // 80% chance - use default "ようこそ"
      console.log('getNewRandomGreeting - Selected default greeting'); // Debug log
      return {
        text: 'ようこそ',
        isSpecial: false,
      };
    } else {
      // 20% chance - use random cast greeting
      const randomIndex = Math.floor(Math.random() * CAST_GREETINGS.length);
      const selectedGreeting = CAST_GREETINGS[randomIndex];
      console.log('getNewRandomGreeting - Selected cast greeting:', selectedGreeting); // Debug log
      
      return {
        text: selectedGreeting.text,
        area: `${selectedGreeting.area} (${selectedGreeting.park})`,
        isSpecial: true,
      };
    }
  } catch (error) {
    console.error('Error getting new random greeting:', error);
    // Fallback to default
    return {
      text: 'ようこそ',
      isSpecial: false,
    };
  }
};

// Function to force set a specific greeting (for testing)
export const forceSetGreeting = async (greeting: { text: string; area?: string; isSpecial: boolean }): Promise<void> => {
  try {
    const today = new Date().toDateString();
    
    if (greeting.isSpecial && greeting.area) {
      // Find the matching cast greeting
      const castGreeting = CAST_GREETINGS.find(cg => 
        cg.text === greeting.text && `${cg.area} (${cg.park})` === greeting.area
      );
      
      console.log('forceSetGreeting - Looking for greeting:', { text: greeting.text, area: greeting.area });
      console.log('forceSetGreeting - Found cast greeting:', castGreeting);
      
      if (castGreeting) {
        dailyGreetingCache = {
          date: today,
          greeting: castGreeting,
          isDefault: false,
        };
        console.log('forceSetGreeting - Set special greeting cache:', dailyGreetingCache);
      } else {
        console.warn('forceSetGreeting - Cast greeting not found, available greetings:', CAST_GREETINGS.map(cg => ({ text: cg.text, area: `${cg.area} (${cg.park})` })));
        // Fallback to default
        dailyGreetingCache = {
          date: today,
          greeting: null,
          isDefault: true,
        };
      }
    } else {
      // Set default greeting
      dailyGreetingCache = {
        date: today,
        greeting: null,
        isDefault: true,
      };
      console.log('forceSetGreeting - Set default greeting');
    }
  } catch (error) {
    console.error('Error setting greeting:', error);
  }
};

// Function to get current cached greeting (for debugging)
export const getCurrentGreeting = (): { text: string; area?: string; isSpecial: boolean } => {
  if (!dailyGreetingCache || dailyGreetingCache.isDefault) {
    return {
      text: 'ようこそ',
      isSpecial: false,
    };
  } else {
    return {
      text: dailyGreetingCache.greeting!.text,
      area: `${dailyGreetingCache.greeting!.area} (${dailyGreetingCache.greeting!.park})`,
      isSpecial: true,
    };
  }
};