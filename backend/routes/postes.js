const express = require('express');
const router = express.Router();
const db = require('../config/database'); // Adjust path as needed

// GET /api/posts - Get all posts
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        p.*,
        parent.name as parent_name
      FROM poste p
      LEFT JOIN poste parent ON p.parent_id = parent.id
      ORDER BY p.created_at DESC
    `;
    
    const [posts] = await db.pool.execute(query);
    
    // Parse actions JSON for each post
    const formattedPosts = posts.map(post => ({
      ...post,
      actions: post.actions ? JSON.parse(post.actions) : []
    }));
    
    res.json(formattedPosts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// GET /api/posts/:id - Get single post
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT 
        p.*,
        parent.name as parent_name
      FROM poste p
      LEFT JOIN poste parent ON p.parent_id = parent.id
      WHERE p.id = ?
    `;
    
    const [posts] = await db.pool.execute(query, [id]);
    
    if (posts.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const post = posts[0];
    post.actions = post.actions ? JSON.parse(post.actions) : [];
    
    res.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// POST /api/posts - Create new post
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      actions = [],
      parent_id,
      position_top = 100,
      position_left = 100,
      position_right = 0,
      position_bottom = 0,
      created_by
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Post name is required' });
    }

    // Validate parent_id exists if provided
    if (parent_id) {
      const [parentCheck] = await db.pool.execute('SELECT id FROM poste WHERE id = ?', [parent_id]);
      if (parentCheck.length === 0) {
        return res.status(400).json({ error: 'Parent post does not exist' });
      }
    }

    const query = `
      INSERT INTO poste (
        name, 
        description, 
        actions, 
        parent_id, 
        position_top, 
        position_left, 
        position_right, 
        position_bottom,
        created_by,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const [result] = await db.pool.execute(query, [
      name,
      description || null,
      JSON.stringify(actions),
      parent_id || null,
      position_top,
      position_left,
      position_right,
      position_bottom,
      created_by || 'Unknown'
    ]);

    res.status(201).json({
      id: result.insertId,
      message: 'Post created successfully'
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// PUT /api/posts/:id - Update post
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      actions = [],
      parent_id,
      position_top,
      position_left,
      position_right,
      position_bottom
    } = req.body;

    // Check if post exists
    const [existingPost] = await db.pool.execute('SELECT id FROM poste WHERE id = ?', [id]);
    if (existingPost.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Validate parent_id exists if provided and is not the same as current post
    if (parent_id && parent_id != id) {
      const [parentCheck] = await db.pool.execute('SELECT id FROM poste WHERE id = ?', [parent_id]);
      if (parentCheck.length === 0) {
        return res.status(400).json({ error: 'Parent post does not exist' });
      }
    }

    // Prevent circular hierarchy
    if (parent_id && parent_id != id) {
      const checkCircular = async (postId, targetParentId) => {
        if (postId == targetParentId) return true;
        
        const [parent] = await db.pool.execute('SELECT parent_id FROM poste WHERE id = ?', [targetParentId]);
        if (parent.length > 0 && parent[0].parent_id) {
          return await checkCircular(postId, parent[0].parent_id);
        }
        return false;
      };

      const isCircular = await checkCircular(id, parent_id);
      if (isCircular) {
        return res.status(400).json({ error: 'Circular hierarchy detected' });
      }
    }

    const query = `
      UPDATE poste 
      SET 
        name = ?, 
        description = ?, 
        actions = ?, 
        parent_id = ?, 
        position_top = ?, 
        position_left = ?, 
        position_right = ?, 
        position_bottom = ?,
        updated_at = NOW()
      WHERE id = ?
    `;

    await db.pool.execute(query, [
      name,
      description || null,
      JSON.stringify(actions),
      parent_id || null,
      position_top || 100,
      position_left || 100,
      position_right || 0,
      position_bottom || 0,
      id
    ]);

    res.json({ message: 'Post updated successfully' });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// PATCH /api/posts/:id/position - Update post position
router.patch('/:id/position', async (req, res) => {
  try {
    const { id } = req.params;
    const { position_top, position_left, position_right, position_bottom } = req.body;

    // Check if post exists
    const [existingPost] = await db.pool.execute('SELECT id FROM poste WHERE id = ?', [id]);
    if (existingPost.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const query = `
      UPDATE poste 
      SET 
        position_top = ?, 
        position_left = ?, 
        position_right = ?, 
        position_bottom = ?,
        updated_at = NOW()
      WHERE id = ?
    `;

    await db.pool.execute(query, [
      position_top || 0,
      position_left || 0,
      position_right || 0,
      position_bottom || 0,
      id
    ]);

    res.json({ message: 'Post position updated successfully' });
  } catch (error) {
    console.error('Error updating post position:', error);
    res.status(500).json({ error: 'Failed to update post position' });
  }
});

// PATCH /api/posts/:id/actions - Update post actions
router.patch('/:id/actions', async (req, res) => {
  try {
    const { id } = req.params;
    const { actions = [] } = req.body;

    // Check if post exists
    const [existingPost] = await db.pool.execute('SELECT id FROM poste WHERE id = ?', [id]);
    if (existingPost.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const query = `
      UPDATE poste 
      SET 
        actions = ?,
        updated_at = NOW()
      WHERE id = ?
    `;

    await db.pool.execute(query, [JSON.stringify(actions), id]);

    res.json({ message: 'Post actions updated successfully' });
  } catch (error) {
    console.error('Error updating post actions:', error);
    res.status(500).json({ error: 'Failed to update post actions' });
  }
});

// DELETE /api/posts/:id - Delete post
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if post exists
    const [existingPost] = await db.pool.execute('SELECT id FROM poste WHERE id = ?', [id]);
    if (existingPost.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if post has children
    const [children] = await db.pool.execute('SELECT id FROM poste WHERE parent_id = ?', [id]);
    if (children.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete post with child posts. Please reassign or delete child posts first.' 
      });
    }

    await db.pool.execute('DELETE FROM poste WHERE id = ?', [id]);

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// GET /api/posts/:id/hierarchy - Get post hierarchy (children)
router.get('/:id/hierarchy', async (req, res) => {
  try {
    const { id } = req.params;

    const getHierarchy = async (postId) => {
      const [children] = await db.pool.execute(
        'SELECT * FROM poste WHERE parent_id = ? ORDER BY name',
        [postId]
      );

      const formattedChildren = [];
      for (const child of children) {
        const childHierarchy = await getHierarchy(child.id);
        formattedChildren.push({
          ...child,
          actions: child.actions ? JSON.parse(child.actions) : [],
          children: childHierarchy
        });
      }

      return formattedChildren;
    };

    const hierarchy = await getHierarchy(id);
    res.json(hierarchy);
  } catch (error) {
    console.error('Error fetching hierarchy:', error);
    res.status(500).json({ error: 'Failed to fetch hierarchy' });
  }
});

module.exports = router;