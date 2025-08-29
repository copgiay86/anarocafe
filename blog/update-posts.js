#!/usr/bin/env node

/**
 * ANARO Coffee Blog - Auto Update Posts Script
 * 
 * Script tự động quét thư mục blog và cập nhật danh sách bài viết
 * trong file index.html để blog index có thể load được các bài mới.
 * 
 * Cách sử dụng:
 * 1. Chạy từ thư mục root của project: node blog/update-posts.js
 * 2. Hoặc thêm vào package.json scripts: "update-blog": "node blog/update-posts.js"
 * 
 * Script sẽ:
 * - Quét tất cả file .html trong thư mục blog/
 * - Lọc ra các file có format YYYY-MM-DD-slug.html
 * - Cập nhật mảng postFiles trong blog/index.html
 * - Tạo file posts.json chứa metadata (tùy chọn)
 */

const fs = require('fs');
const path = require('path');

class BlogPostUpdater {
    constructor() {
        this.blogDir = './blog';
        this.indexFile = path.join(this.blogDir, 'index.html');
        this.postsJsonFile = path.join(this.blogDir, 'posts.json');
    }

    // Quét và tìm tất cả file bài viết
    scanPosts() {
        try {
            const files = fs.readdirSync(this.blogDir);
            
            // Lọc file có format YYYY-MM-DD-slug.html
            const postFiles = files
                .filter(file => {
                    return file.match(/^\d{4}-\d{2}-\d{2}-.+\.html$/) && 
                           file !== 'index.html';
                })
                .map(file => file.replace('.html', ''))
                .sort()
                .reverse(); // Sắp xếp mới nhất trước

            console.log(`🔍 Found ${postFiles.length} blog posts:`);
            postFiles.forEach(post => console.log(`   - ${post}`));

            return postFiles;
        } catch (error) {
            console.error('❌ Error scanning posts:', error.message);
            return [];
        }
    }

    // Trích xuất metadata từ file HTML
    extractPostMetadata(filename) {
        try {
            const filePath = path.join(this.blogDir, `${filename}.html`);
            const content = fs.readFileSync(filePath, 'utf8');

            // Trích xuất metadata từ meta tags
            const metadata = {
                slug: filename,
                url: `${filename}.html`,
                title: this.extractMeta(content, 'anaro:title') || 'Untitled',
                description: this.extractMeta(content, 'anaro:description') || '',
                category: this.extractMeta(content, 'anaro:category') || 'Uncategorized',
                tags: this.extractMeta(content, 'anaro:tags')?.split(',').map(t => t.trim()) || [],
                date: this.extractMeta(content, 'anaro:date') || filename.substring(0, 10),
                author: this.extractMeta(content, 'anaro:author') || 'ANARO Coffee',
                readingTime: this.extractMeta(content, 'anaro:reading-time') || '5',
                featuredImage: this.extractMeta(content, 'anaro:featured-image') || ''
            };

            return metadata;
        } catch (error) {
            console.warn(`⚠️  Could not extract metadata from ${filename}:`, error.message);
            return null;
        }
    }

    // Helper function để trích xuất meta tag
    extractMeta(html, name) {
        const regex = new RegExp(`<meta\\s+name="${name}"\\s+content="([^"]*)"`, 'i');
        const match = html.match(regex);
        return match ? match[1] : null;
    }

    // Cập nhật file index.html với danh sách bài viết mới
    updateIndexHtml(postFiles) {
        try {
            let content = fs.readFileSync(this.indexFile, 'utf8');

            // Tìm và thay thế mảng postFiles
            const postFilesRegex = /const postFiles = \[([\s\S]*?)\];/;
            
            const newPostFilesArray = `const postFiles = [
${postFiles.map(file => `                        '${file}'`).join(',\n')}
                    ];`;

            if (content.match(postFilesRegex)) {
                content = content.replace(postFilesRegex, newPostFilesArray);
                fs.writeFileSync(this.indexFile, content);
                console.log(`✅ Updated ${postFiles.length} posts in index.html`);
                return true;
            } else {
                console.error('❌ Could not find postFiles array in index.html');
                return false;
            }
        } catch (error) {
            console.error('❌ Error updating index.html:', error.message);
            return false;
        }
    }

    // Tạo file posts.json với metadata (tùy chọn - để backup)
    generatePostsJson(postFiles) {
        try {
            const posts = [];
            
            for (const filename of postFiles) {
                const metadata = this.extractPostMetadata(filename);
                if (metadata) {
                    posts.push(metadata);
                }
            }

            fs.writeFileSync(this.postsJsonFile, JSON.stringify(posts, null, 2));
            console.log(`📄 Generated posts.json with ${posts.length} posts`);
            
            return posts;
        } catch (error) {
            console.error('❌ Error generating posts.json:', error.message);
            return [];
        }
    }

    // Chạy toàn bộ quy trình cập nhật
    run() {
        console.log('🚀 ANARO Coffee Blog Post Updater');
        console.log('=====================================\n');

        // Kiểm tra thư mục blog
        if (!fs.existsSync(this.blogDir)) {
            console.error(`❌ Blog directory not found: ${this.blogDir}`);
            process.exit(1);
        }

        if (!fs.existsSync(this.indexFile)) {
            console.error(`❌ Index file not found: ${this.indexFile}`);
            process.exit(1);
        }

        // Quét bài viết
        const postFiles = this.scanPosts();
        
        if (postFiles.length === 0) {
            console.log('📝 No blog posts found');
            return;
        }

        // Cập nhật index.html
        const updateSuccess = this.updateIndexHtml(postFiles);
        
        if (updateSuccess) {
            // Tạo posts.json (tùy chọn)
            this.generatePostsJson(postFiles);
            
            console.log('\n✨ Blog update completed successfully!');
            console.log('\n📋 Next steps:');
            console.log('   1. Review the updated index.html');
            console.log('   2. Test the blog locally');
            console.log('   3. Commit and push to deploy');
        } else {
            console.log('\n❌ Blog update failed');
            process.exit(1);
        }
    }
}

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
    const updater = new BlogPostUpdater();
    updater.run();
}

module.exports = BlogPostUpdater;
