const { Client } = require('@notionhq/client');
const fs = require('fs/promises');
const path = require('path');

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

async function getBlogPosts() {
  const response = await notion.databases.query({
    database_id: process.env.NOTION_DATABASE_ID,
    filter: {
      property: 'Status',
      select: {
        equals: 'Published',
      },
    },
    sorts: [
      {
        property: 'Date',
        direction: 'descending',
      },
    ],
  });

  return response.results;
}

async function convertBlocksToMarkdown(blocks) {
  let markdown = '';
  
  for (const block of blocks) {
    switch (block.type) {
      case 'paragraph':
        markdown += block.paragraph.rich_text.map(t => t.plain_text).join('') + '\n\n';
        break;
      case 'heading_1':
        markdown += '# ' + block.heading_1.rich_text.map(t => t.plain_text).join('') + '\n\n';
        break;
      case 'heading_2':
        markdown += '## ' + block.heading_2.rich_text.map(t => t.plain_text).join('') + '\n\n';
        break;
      case 'heading_3':
        markdown += '### ' + block.heading_3.rich_text.map(t => t.plain_text).join('') + '\n\n';
        break;
      case 'bulleted_list_item':
        markdown += '- ' + block.bulleted_list_item.rich_text.map(t => t.plain_text).join('') + '\n';
        break;
      case 'numbered_list_item':
        markdown += '1. ' + block.numbered_list_item.rich_text.map(t => t.plain_text).join('') + '\n';
        break;
      case 'code':
        markdown += '```' + (block.code.language || '') + '\n' + 
                   block.code.rich_text.map(t => t.plain_text).join('') + 
                   '\n```\n\n';
        break;
      case 'image':
        const imageUrl = block.image.type === 'external' ? 
          block.image.external.url : 
          block.image.file.url;
        markdown += `![Image](${imageUrl})\n\n`;
        break;
    }
  }
  
  return markdown;
}

async function convertNotionToMarkdown(page) {
  const blocks = await notion.blocks.children.list({
    block_id: page.id,
  });

  const title = page.properties.Title.title.map(t => t.plain_text).join('');
  const date = page.properties.Date.date.start;
  
  let frontMatter = '---\n';
  frontMatter += `title: "${title}"\n`;
  frontMatter += `date: ${date}\n`;
  frontMatter += '---\n\n';
  
  const content = await convertBlocksToMarkdown(blocks.results);
  
  return frontMatter + content;
}

async function main() {
  try {
    // Ensure content directory exists
    await fs.mkdir(path.join(process.cwd(), 'content'), { recursive: true });
    
    const posts = await getBlogPosts();
    console.log(`Found ${posts.length} published posts`);
    
    for (const post of posts) {
      console.log(`Processing: ${post.properties.Title.title[0].plain_text}`);
      const markdown = await convertNotionToMarkdown(post);
      const fileName = `${post.properties.Slug.rich_text[0].plain_text}.md`;
      
      await fs.writeFile(
        path.join(process.cwd(), 'content', fileName),
        markdown
      );
      console.log(`Created: content/${fileName}`);
    }
  } catch (error) {
    console.error('Error syncing Notion content:', error);
    process.exit(1);
  }
}

main(); 