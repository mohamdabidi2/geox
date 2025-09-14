import { useState, useRef, useEffect } from 'react';
import { Users, Settings, Edit2, Trash2, Plus } from 'lucide-react';

const HierarchicalPostView = ({ posts, onPositionUpdate, onEdit, onDelete, onManagePermissions }) => {
  const [draggedPost, setDraggedPost] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState({ width: 1200, height: 800 });
  const containerRef = useRef(null);

  useEffect(() => {
    const updateContainerSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    updateContainerSize();
    window.addEventListener('resize', updateContainerSize);
    return () => window.removeEventListener('resize', updateContainerSize);
  }, []);

  const handleMouseDown = (e, post) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    
    setDraggedPost(post);
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });

    const handleMouseMove = (e) => {
      if (!draggedPost) return;
      
      const newLeft = e.clientX - containerRect.left - dragOffset.x;
      const newTop = e.clientY - containerRect.top - dragOffset.y;
      
      // Constrain within container bounds
      const constrainedLeft = Math.max(0, Math.min(newLeft, containerSize.width - 200));
      const constrainedTop = Math.max(0, Math.min(newTop, containerSize.height - 100));
      
      // Update position in real-time
      const postElement = document.getElementById(`post-${post.id}`);
      if (postElement) {
        postElement.style.left = `${constrainedLeft}px`;
        postElement.style.top = `${constrainedTop}px`;
      }
    };

    const handleMouseUp = (e) => {
      if (draggedPost) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const newLeft = e.clientX - containerRect.left - dragOffset.x;
        const newTop = e.clientY - containerRect.top - dragOffset.y;
        
        // Constrain within container bounds
        const constrainedLeft = Math.max(0, Math.min(newLeft, containerSize.width - 200));
        const constrainedTop = Math.max(0, Math.min(newTop, containerSize.height - 100));
        
        onPositionUpdate(draggedPost.id, {
          position_left: constrainedLeft,
          position_top: constrainedTop,
          position_right: containerSize.width - constrainedLeft - 200,
          position_bottom: containerSize.height - constrainedTop - 100
        });
      }
      
      setDraggedPost(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const getConnectionLines = () => {
    const lines = [];
    posts.forEach(post => {
      if (post.parent_id) {
        const parent = posts.find(p => p.id === post.parent_id);
        if (parent) {
          lines.push({
            from: {
              x: parent.position_left + 100, // Center of parent post
              y: parent.position_top + 50
            },
            to: {
              x: post.position_left + 100, // Center of child post
              y: post.position_top + 50
            }
          });
        }
      }
    });
    return lines;
  };

  const connectionLines = getConnectionLines();

  return (
    <div className="mt-8 w-full">
      <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <h3 className="text-lg font-medium text-blue-900 mb-2">Vue hiérarchique de l'organisation</h3>
        <p className="text-sm text-blue-700">
          Glissez-déposez les postes pour réorganiser la structure de l'entreprise. Les lignes montrent les relations parent-enfant.
        </p>
      </div>

      <div
        ref={containerRef}
        className="relative w-full border-2 border-gray-300 rounded-lg bg-gray-50 overflow-hidden shadow-sm"
        style={{ height: '600px', minHeight: '600px' }}
      >
        {/* Grid background */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, #e5e7eb 1px, transparent 1px),
              linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }}
        />

        {/* Connection lines SVG */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 1 }}
        >
          {connectionLines.map((line, index) => (
            <line
              key={index}
              x1={line.from.x}
              y1={line.from.y}
              x2={line.to.x}
              y2={line.to.y}
              stroke="#4B5563"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
          ))}
        </svg>

        {/* Posts */}
        {posts.map((post) => (
          <div
            key={post.id}
            id={`post-${post.id}`}
            className={`absolute bg-white rounded-lg shadow-md border cursor-move select-none transition-all duration-150 hover:shadow-lg ${
              draggedPost?.id === post.id 
                ? 'border-blue-500 shadow-lg z-50 transform scale-105' 
                : 'border-gray-300 hover:border-gray-400 z-10'
            }`}
            style={{
              left: `${post.position_left || 100}px`,
              top: `${post.position_top || 100}px`,
              width: '200px',
              minHeight: '100px'
            }}
            onMouseDown={(e) => handleMouseDown(e, post)}
          >
            <div className="p-3">
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Users className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-sm font-semibold text-gray-900 truncate">
                    {post.name}
                  </span>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onManagePermissions(post);
                    }}
                    className="text-green-600 hover:text-green-800 p-1 transition-colors"
                    title="Gérer les permissions"
                  >
                    <Settings className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(post);
                    }}
                    className="text-blue-600 hover:text-blue-800 p-1 transition-colors"
                    title="Modifier le poste"
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(post.id);
                    }}
                    className="text-red-600 hover:text-red-800 p-1 transition-colors"
                    title="Supprimer le poste"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Description */}
              {post.description && (
                <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                  {post.description}
                </p>
              )}

              {/* Actions count */}
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {post.actions ? post.actions.length : 0} action{post.actions && post.actions.length !== 1 ? 's' : ''}
                </span>
                {post.parent_id && (
                  <span className="text-xs text-gray-500">
                    Enfant
                  </span>
                )}
              </div>
            </div>

            {/* Drag handle */}
            <div className="absolute top-1 right-1 w-3 h-3 bg-gray-400 rounded-full opacity-60 hover:opacity-100 cursor-move"></div>
          </div>
        ))}

        {/* Empty state */}
        {posts.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun poste créé</h3>
              <p className="text-gray-500">Créez votre premier poste organisationnel pour commencer.</p>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 p-3 bg-gray-100 rounded-lg border border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Légende :</h4>
        <div className="flex flex-wrap gap-4 text-xs text-gray-600">
          <div className="flex items-center">
            <div className="w-4 h-0.5 bg-gray-500 mr-2" style={{ borderStyle: 'dashed' }}></div>
            <span>Relation parent-enfant</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
            <span>Poignée de déplacement</span>
          </div>
          <div className="flex items-center">
            <Settings className="h-3 w-3 text-green-600 mr-1" />
            <span>Gérer les permissions</span>
          </div>
          <div className="flex items-center">
            <Edit2 className="h-3 w-3 text-blue-600 mr-1" />
            <span>Modifier le poste</span>
          </div>
          <div className="flex items-center">
            <Trash2 className="h-3 w-3 text-red-600 mr-1" />
            <span>Supprimer le poste</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HierarchicalPostView;