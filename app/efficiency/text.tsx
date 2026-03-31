import React, { useState } from 'react';
import { StyleSheet, ScrollView, TextInput, View, TouchableOpacity } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Stack } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { alertSimple } from '@/components/utils/alert-compat';

export default function TextTools() {
  const [text, setText] = useState('');

  const stats = {
    chars: text.length,
    words: text.trim() ? text.trim().split(/\s+/).length : 0,
    lines: text ? text.split('\n').length : 0,
  };

  const handleCopy = async () => {
    try {
      const ok = await Clipboard.setStringAsync(text);
      if (ok) {
        alertSimple('提示', '已复制到剪贴板');
      } else {
        alertSimple('错误', '复制失败，请检查浏览器权限或手动复制');
      }
    } catch {
      alertSimple('错误', '复制失败，请检查浏览器权限或手动复制');
    }
  };

  const toUpper = () => setText(text.toUpperCase());
  const toLower = () => setText(text.toLowerCase());
  const clearText = () => setText('');
  
  const toBase64 = () => {
    try {
      setText(btoa(unescape(encodeURIComponent(text))));
    } catch (e) {
      alertSimple('错误', 'Base64 编码失败');
    }
  };

  const fromBase64 = () => {
    try {
      setText(decodeURIComponent(escape(atob(text))));
    } catch (e) {
      alertSimple('错误', 'Base64 解码失败，请确保输入格式正确');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: '文本工具', headerShown: true }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <ThemedView style={styles.statsCard}>
          <View style={styles.statItem}>
            <ThemedText style={styles.statLabel}>字符数</ThemedText>
            <ThemedText style={styles.statValue}>{stats.chars}</ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <ThemedText style={styles.statLabel}>词数</ThemedText>
            <ThemedText style={styles.statValue}>{stats.words}</ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <ThemedText style={styles.statLabel}>行数</ThemedText>
            <ThemedText style={styles.statValue}>{stats.lines}</ThemedText>
          </View>
        </ThemedView>

        <TextInput
          style={styles.input}
          multiline
          placeholder="在此输入或粘贴文本..."
          value={text}
          onChangeText={setText}
          textAlignVertical="top"
        />

        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionButton} onPress={handleCopy}>
            <MaterialIcons name="content-copy" size={20} color="#007AFF" />
            <ThemedText style={styles.actionText}>复制</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={clearText}>
            <MaterialIcons name="delete-sweep" size={20} color="#FF3B30" />
            <ThemedText style={[styles.actionText, { color: '#FF3B30' }]}>清空</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={toUpper}>
            <ThemedText style={styles.actionText}>大写</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={toLower}>
            <ThemedText style={styles.actionText}>小写</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={toBase64}>
            <ThemedText style={styles.actionText}>Base64 编码</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={fromBase64}>
            <ThemedText style={styles.actionText}>Base64 解码</ThemedText>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E5E5EA',
    alignSelf: 'center',
  },
  input: {
    height: 200,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    textAlignVertical: 'top',
    borderColor: '#E5E5EA',
    borderWidth: 1,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    minWidth: '30%',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#007AFF',
  },
});
