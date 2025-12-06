import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { profiles } = await request.json();
    
    // Simulate fetching real-time data
    // In a real app, you would use official APIs:
    // - Twitter API v2
    // - LinkedIn Marketing API
    // - Instagram Graph API
    // - YouTube Data API
    
    const stats: any = {
      totalViews: 0,
      totalFollowers: 0,
      engagementRate: '0%',
      platforms: {}
    };

    // Helper to generate realistic random numbers based on username hash or similar
    const getSimulatedCount = (str: string, min: number, max: number) => {
        if (!str) return 0;
        // Simple hash to simulate consistent numbers for the same input
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        const seed = Math.abs(hash) / 2147483647; 
        return Math.floor(seed * (max - min) + min);
    };

    if (profiles.twitter) {
        const followers = getSimulatedCount(profiles.twitter, 100, 5000);
        stats.platforms.twitter = { followers, views: followers * 3 };
        stats.totalFollowers += followers;
        stats.totalViews += followers * 3;
    }

    if (profiles.linkedin) {
        const connections = getSimulatedCount(profiles.linkedin, 50, 2000);
        stats.platforms.linkedin = { connections, views: connections * 5 };
        stats.totalFollowers += connections;
        stats.totalViews += connections * 5;
    }

    if (profiles.instagram) {
        const followers = getSimulatedCount(profiles.instagram, 200, 10000);
        stats.platforms.instagram = { followers, views: followers * 0.8 };
        stats.totalFollowers += followers;
        stats.totalViews += followers * 0.8;
    }

    if (profiles.youtube) {
        const subs = getSimulatedCount(profiles.youtube, 10, 5000);
        const views = subs * 15; // Higher views for YT
        stats.platforms.youtube = { subscribers: subs, views };
        stats.totalFollowers += subs;
        stats.totalViews += views;
    }

    // Format Large Numbers
    const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
        return num.toString();
    };

    // Calc pseudo engagement (1-5%)
    const engagement = stats.totalFollowers > 0 ? (getSimulatedCount('engagement', 10, 50) / 10).toFixed(1) + '%' : '0%';

    return NextResponse.json({
        totalViews: formatNumber(stats.totalViews),
        totalFollowers: formatNumber(stats.totalFollowers),
        engagementRate: engagement,
        platforms: stats.platforms
    });

  } catch (error) {
    console.error('Social Stats Error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
