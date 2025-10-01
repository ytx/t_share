import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Alert } from '@mui/material';
import { PORT_RANGES } from '../../constants/portRanges';
import { useGetProjectPortsQuery, useUpdateProjectPortMutation, useLazyCheckPortConflictQuery } from '../../store/api/portManagementApi';

interface PortSettingsProps {
  projectId: number;
}

const PortSettings: React.FC<PortSettingsProps> = ({ projectId }) => {
  const { data: portsResponse, isLoading } = useGetProjectPortsQuery(projectId);
  const [updatePort] = useUpdateProjectPortMutation();
  const [checkConflict] = useLazyCheckPortConflictQuery();

  const [portValues, setPortValues] = useState<Record<string, number>>({});
  const [portErrors, setPortErrors] = useState<Record<string, string>>({});

  // ポート値を初期化
  useEffect(() => {
    if (portsResponse?.data) {
      setPortValues(portsResponse.data as Record<string, number>);
    }
  }, [portsResponse]);

  const handlePortChange = (variableName: string, value: string) => {
    const portNumber = parseInt(value, 10);

    if (isNaN(portNumber) || portNumber < 1 || portNumber > 65535) {
      setPortErrors(prev => ({
        ...prev,
        [variableName]: 'ポート番号は1-65535の範囲で指定してください',
      }));
      return;
    }

    setPortValues(prev => ({
      ...prev,
      [variableName]: portNumber,
    }));

    // 競合チェック（デバウンス）
    setTimeout(async () => {
      try {
        const result = await checkConflict({
          projectId,
          params: { variableName, port: portNumber },
        }).unwrap();

        if (result.data.hasConflict) {
          setPortErrors(prev => ({
            ...prev,
            [variableName]: '他のプロジェクトで使用中のポート番号です',
          }));
        } else {
          setPortErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[variableName];
            return newErrors;
          });

          // 競合がなければ自動保存
          await updatePort({
            projectId,
            data: { variableName, port: portNumber },
          }).unwrap();
        }
      } catch (error) {
        console.error('Port conflict check failed:', error);
      }
    }, 500);
  };

  if (isLoading) {
    return <Typography>読み込み中...</Typography>;
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="subtitle2" sx={{ mb: 2 }}>ポート設定</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
        各開発環境で使用するポート番号を設定します。他のプロジェクトと重複しないよう自動チェックされます。
      </Typography>

      {Object.entries(PORT_RANGES).map(([key, config]) => {
        const variableName = config.key;
        const currentValue = portValues[variableName] || config.start;
        const error = portErrors[variableName];

        return (
          <TextField
            key={key}
            label={config.label}
            type="number"
            value={currentValue}
            onChange={(e) => handlePortChange(variableName, e.target.value)}
            error={!!error}
            helperText={error || `デフォルト: ${config.start}から自動採番`}
            fullWidth
            margin="dense"
            InputProps={{
              inputProps: { min: 1, max: 65535 }
            }}
          />
        );
      })}

      {Object.keys(portErrors).length > 0 && (
        <Alert severity="error" sx={{ mt: 2 }}>
          ポート番号の競合があります。別の番号を指定してください。
        </Alert>
      )}
    </Box>
  );
};

export default PortSettings;
