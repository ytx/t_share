import React, { useState } from 'react';
import { Box } from '@mui/material';
import SplitPane from 'react-split-pane';
import TemplateSearch from '../components/Templates/TemplateSearch';
import DocumentEditor from '../components/Editor/DocumentEditor';
import { Template } from '../types';
import { useUseTemplateMutation } from '../store/api/templateApi';

const Dashboard: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [splitSize, setSplitSize] = useState('40%');

  const [useTemplate] = useUseTemplateMutation();

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
  };

  const handleCreateTemplate = () => {
    console.log('Create new template');
    // This will open a modal in Phase 4
  };

  const handleUseTemplate = async (templateId: number) => {
    try {
      await useTemplate(templateId).unwrap();
      console.log('Template usage recorded');
    } catch (error) {
      console.error('Failed to record template usage:', error);
    }
  };

  const handleSaveDocument = (data: {
    title?: string;
    content: string;
    contentMarkdown: string;
    projectId?: number;
  }) => {
    console.log('Save document:', data);
    // This will be implemented in Phase 3.3
    alert('文書保存機能は Phase 3.3 で実装予定です');
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
          <DocumentEditor
            selectedTemplate={selectedTemplate}
            onSaveDocument={handleSaveDocument}
            onUseTemplate={handleUseTemplate}
          />
        </Box>
      </SplitPane>
    </Box>
  );
};

export default Dashboard;