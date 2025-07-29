import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StoryDetails } from "@/components/story-details";

interface StoryPageProps {
  params: Promise<{ id: string }>;
}

export default async function StoryPage({ params }: StoryPageProps) {
  const supabase = await createClient();
  const { id } = await params;

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  // Mock story data - in a real app, this would come from your database
  const mockStory = {
    id,
    title: id === "generated-story-123" ? "A Love Rekindled" : "Love in the Vineyard",
    genre: "Contemporary",
    author: "You",
    createdAt: "2024-01-15",
    isPublic: false,
    characters: ["Sarah", "Marco"],
    setting: "Tuscan Vineyard",
    content: id === "generated-story-123" ? `
# A Love Rekindled

The morning sun cast golden rays across the rolling hills of Tuscany as Sarah Martinez stepped out of her rental car, breathing in the sweet scent of ripening grapes. After ten years away, she had finally returned to Villa Rosalina, the vineyard that held so many bittersweet memories.

"Sarah?" 

She turned at the familiar voice, her heart skipping a beat. Marco Benedetti stood in the doorway of the old stone farmhouse, looking as handsome as ever with his sun-bronzed skin and those deep brown eyes that had haunted her dreams for a decade.

"Hello, Marco," she said softly, trying to keep her voice steady despite the flood of emotions threatening to overwhelm her.

He approached slowly, as if she might disappear like a mirage. "I heard about your grandmother. I'm sorry for your loss."

Sarah nodded, tears pricking her eyes. Nonna had been the one who brought them together all those years ago, teaching them both about winemaking and life. She was also the reason Sarah had stayed away for so long.

"She left me the vineyard," Sarah said, pulling the legal documents from her purse. "I'm here to... to figure out what to do with it."

Marco's expression shifted, something unreadable flashing in his eyes. "The vineyard's been struggling, Sarah. Without your grandmother's touch, and with the drought last year..." He ran a hand through his dark hair. "I've been trying to keep it afloat, but..."

"You've been taking care of it?" Sarah asked, surprised.

"Someone had to," he said simply. "Your grandmother, she... she never stopped believing you'd come back."

The weight of guilt settled heavily on Sarah's shoulders. She'd stayed away because of their complicated past, because leaving Marco had been the hardest thing she'd ever done. But Nonna had suffered for her stubborn pride.

"Marco, I—"

"Don't," he said gently, stepping closer. "We both made choices back then. But you're here now, and that's what matters."

As they walked through the vineyard together, Sarah couldn't ignore the way her pulse quickened whenever Marco's hand accidentally brushed hers, or how his laugh still made her stomach flutter like she was seventeen again.

The vines were indeed struggling, but Sarah could see the love and care Marco had poured into maintaining them. He'd honored her grandmother's memory in ways she never could have from her corporate job in New York.

"I have a confession," Marco said as they paused beneath the old olive tree where they'd shared their first kiss. "I bought the property next door last year. I was hoping... if you ever came back..."

Sarah's breath caught. "Marco..."

"I never stopped loving you, Sarah," he said, his voice rough with emotion. "I know we were young and stupid, and I know I hurt you by not fighting harder when you left. But seeing you here now, in this place where we fell in love... maybe we could try again?"

Sarah looked into his eyes and saw the same passion, the same tenderness that had made her fall for him all those years ago. But now there was something else too – maturity, wisdom, the depth that came from real loss and real love.

"I missed you," she whispered, finally admitting what her heart had known all along. "Every single day."

When Marco kissed her beneath the olive tree, Sarah knew she was finally home. The vineyard might need work, their relationship might need rebuilding, but some loves were worth fighting for. Some loves were worth coming home to.

As the sun set over the Tuscan hills, painting the sky in shades of rose and gold, Sarah and Marco began planning not just the revival of Villa Rosalina, but the rekindling of a love that had never truly died.

*The End*
    ` : `
# Love in the Vineyard

Sarah Rodriguez had always dreamed of owning her own business, but she never imagined it would be a struggling vineyard in Napa Valley that she'd inherited from a great-aunt she barely knew.

Standing among the overgrown vines, she felt overwhelmed. The property was beautiful but clearly neglected, and her business degree hadn't prepared her for agriculture.

"You must be the new owner."

Sarah turned to find a tall, ruggedly handsome man with dirt-stained hands and the kindest eyes she'd ever seen. His dark hair was tousled from work, and his warm smile made her heart skip.

"I'm Marco Santini from the neighboring vineyard," he said, extending his hand. "Your aunt was a wonderful woman. I'm sorry for your loss."

"Thank you," Sarah replied, trying not to notice how his handshake sent electricity up her arm. "I'm Sarah. And honestly, I have no idea what I'm doing with this place."

Marco's laugh was rich and warm. "Well, you've come to the right valley. Wine brings people together, and we take care of our own here."

Over the following weeks, Marco became Sarah's guide to the world of winemaking. He taught her about soil conditions and pruning techniques, about the delicate balance of sugar and acid that made great wine. But more than that, he showed her the passion and artistry behind every bottle.

Sarah found herself looking forward to their morning meetings, the way Marco's face lit up when he talked about his craft, how gentle his hands were with the vines. She was falling for more than just the vineyard.

But Marco seemed determined to keep things professional, even as the chemistry between them grew stronger with each passing day...

*[Story continues for several more chapters]*

*The End*
    `,
    preferences: {
      genre: "contemporary",
      mood: "passionate",
      characters: {
        protagonist: { name: "Sarah", traits: ["Independent", "Determined"], occupation: "Business Owner" },
        love_interest: { name: "Marco", traits: ["Kind", "Passionate"], occupation: "Vintner" }
      },
      setting: {
        time_period: "present",
        location: "Tuscan Vineyard",
        atmosphere: "rustic"
      },
      elements: {
        tropes: ["Second Chance Romance", "Opposites Attract"],
        heat_level: "warm",
        story_length: "novella"
      }
    }
  };

  return <StoryDetails story={mockStory} />;
}