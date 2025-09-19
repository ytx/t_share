import React, { useState } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import SplitPane from 'react-split-pane';
import TemplateSearch from '../components/Templates/TemplateSearch';
import { Template } from '../types';

const Dashboard: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [splitSize, setSplitSize] = useState('40%');

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    console.log('Selected template:', template);
  };

  const handleCreateTemplate = () => {
    console.log('Create new template');
    // This will open a modal in Phase 2.3
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SplitPane
        split="vertical"
        minSize={300}
        maxSize={800}
        defaultSize={splitSize}
        onChange={(size) => setSplitSize(typeof size === 'string' ? size : `${size}px`)}
        style={{ height: '100%' }}
        paneStyle={{ overflow: 'hidden' }}
      >
        {/* Left Panel - Template Search */}
        <Box sx={{ height: '100%', p: 2, bgcolor: 'background.default' }}>
          <TemplateSearch
            onTemplateSelect={handleTemplateSelect}
            onCreateTemplate={handleCreateTemplate}
          />
        </Box>

        {/* Right Panel - Document Editor */}
        <Box sx={{ height: '100%', p: 2, bgcolor: 'background.paper' }}>
          <Paper sx={{ height: '100%', p: 3, display: 'flex', flexDirection: 'column' }}>
            {selectedTemplate ? (
              <Box>
                <Typography variant="h5" gutterBottom>
                  {selectedTemplate.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  作成者: {selectedTemplate.creator?.displayName || selectedTemplate.creator?.username}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  更新日: {new Date(selectedTemplate.updatedAt).toLocaleString('ja-JP')}
                </Typography>
                {selectedTemplate.description && (
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedTemplate.description}
                  </Typography>
                )}
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: 'grey.50',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    overflow: 'auto',
                    maxHeight: '60vh',
                  }}
                >
                  {selectedTemplate.content}
                </Paper>
              </Box>
            ) : (
              <Box
                sx={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                }}
              >
                <Box>
                  <Typography variant="h5" color="text.secondary" gutterBottom>
                    Template Share
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    左側から定型文を選択してください
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Phase 2.2: 基本UI実装完了
                  </Typography>
                </Box>
              </Box>
            )}
          </Paper>
        </Box>
      </SplitPane>
    </Box>
  );
};

export default Dashboard;