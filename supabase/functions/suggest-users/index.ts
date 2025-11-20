import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { limit = 10 } = await req.json().catch(() => ({}));

    // Get user's current following list
    const { data: currentFollowing } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);

    const followingIds = currentFollowing?.map(f => f.following_id) || [];
    const excludeIds = [...followingIds, user.id];

    // Get all potential candidates
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('id, user_name, user_handle, avatar_url, bio, location, is_verified')
      .not('id', 'in', `(${excludeIds.join(',')})`);

    if (!allProfiles || allProfiles.length === 0) {
      return new Response(JSON.stringify({ suggestions: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate scores for each candidate
    const scoredProfiles = await Promise.all(
      allProfiles.map(async (profile) => {
        let score = 0;

        // 1. Mutual connections (highest weight: 40 points)
        const { data: mutualFollows } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', profile.id)
          .in('following_id', followingIds);
        
        const mutualCount = mutualFollows?.length || 0;
        score += Math.min(mutualCount * 10, 40);

        // 2. Followers of people I follow (30 points)
        const { data: followersOfMyFollowing } = await supabase
          .from('follows')
          .select('follower_id')
          .in('following_id', followingIds)
          .eq('follower_id', profile.id);
        
        if (followersOfMyFollowing && followersOfMyFollowing.length > 0) {
          score += 30;
        }

        // 3. Shared hashtags (20 points)
        const { data: myPosts } = await supabase
          .from('posts')
          .select('id')
          .eq('user_id', user.id);

        if (myPosts && myPosts.length > 0) {
          const myPostIds = myPosts.map(p => p.id);
          
          const { data: myHashtags } = await supabase
            .from('post_hashtags')
            .select('hashtag_id')
            .in('post_id', myPostIds);

          if (myHashtags && myHashtags.length > 0) {
            const myHashtagIds = myHashtags.map(h => h.hashtag_id);
            
            const { data: theirPosts } = await supabase
              .from('posts')
              .select('id')
              .eq('user_id', profile.id);
            
            if (theirPosts && theirPosts.length > 0) {
              const theirPostIds = theirPosts.map(p => p.id);
              
              const { data: sharedHashtags } = await supabase
                .from('post_hashtags')
                .select('hashtag_id')
                .in('post_id', theirPostIds)
                .in('hashtag_id', myHashtagIds);

              const sharedCount = sharedHashtags?.length || 0;
              score += Math.min(sharedCount * 5, 20);
            }
          }
        }

        // 4. Interactions - likes on their posts (15 points)
        const { data: theirPostsForLikes } = await supabase
          .from('posts')
          .select('id')
          .eq('user_id', profile.id);

        if (theirPostsForLikes && theirPostsForLikes.length > 0) {
          const theirPostIds = theirPostsForLikes.map(p => p.id);
          
          const { data: myLikesOnTheirPosts } = await supabase
            .from('likes')
            .select('id')
            .eq('user_id', user.id)
            .in('post_id', theirPostIds);

          const likesCount = myLikesOnTheirPosts?.length || 0;
          score += Math.min(likesCount * 3, 15);
        }

        // 5. Interactions - comments on their posts (15 points)
        const { data: theirPostsForComments } = await supabase
          .from('posts')
          .select('id')
          .eq('user_id', profile.id);

        if (theirPostsForComments && theirPostsForComments.length > 0) {
          const theirPostIds = theirPostsForComments.map(p => p.id);
          
          const { data: myCommentsOnTheirPosts } = await supabase
            .from('comments')
            .select('id')
            .eq('user_id', user.id)
            .in('post_id', theirPostIds);

          const commentsCount = myCommentsOnTheirPosts?.length || 0;
          score += Math.min(commentsCount * 5, 15);
        }

        // 6. Same location (10 points)
        const { data: myProfile } = await supabase
          .from('profiles')
          .select('location')
          .eq('id', user.id)
          .single();

        if (myProfile?.location && profile.location && 
            myProfile.location.toLowerCase() === profile.location.toLowerCase()) {
          score += 10;
        }

        // 7. Verified badge bonus (5 points)
        if (profile.is_verified) {
          score += 5;
        }

        // 8. Activity level - recent posts (10 points)
        const { data: recentPosts } = await supabase
          .from('posts')
          .select('id')
          .eq('user_id', profile.id)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

        const recentPostsCount = recentPosts?.length || 0;
        score += Math.min(recentPostsCount * 2, 10);

        return {
          ...profile,
          score,
          mutualConnections: mutualCount,
        };
      })
    );

    // Sort by score and get top suggestions
    const suggestions = scoredProfiles
      .filter(p => p.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    console.log('Generated suggestions:', suggestions.length);

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in suggest-users function:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
