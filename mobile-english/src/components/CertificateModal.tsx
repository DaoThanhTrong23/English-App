import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

export interface LevelGroupOption {
  id: string;
  name: string;
  title: string;
  desc: string;
  levels: string[];
  nextGroupId?: string | null;
}

export const THREE_LEVEL_OPTIONS: LevelGroupOption[] = [
  { id: 'A1-A2', name: 'Dễ', title: 'Dễ (A1 - A2)', desc: 'Dành cho người mới bắt đầu', levels: ['A1', 'A2'], nextGroupId: 'B1-B2' },
  { id: 'B1-B2', name: 'Trung bình', title: 'Trung bình (B1 - B2)', desc: 'Giao tiếp cơ bản đến khá', levels: ['B1', 'B2'], nextGroupId: 'C1-C2' },
  { id: 'C1-C2', name: 'Khó', title: 'Khó (C1 - C2)', desc: 'Thành thạo và chuyên sâu', levels: ['C1', 'C2'], nextGroupId: null },
];

export interface CertificateData {
  certificateId: string;
  recipientName: string;
  level: string;
  levelTitle: string;
  totalLessons: number;
  totalWords: number;
  xpPoints?: number;
  issuedDate: string;
  nextLevel?: string | null;
}

interface CertificateModalProps {
  visible: boolean;
  onClose: () => void;
  certificate: CertificateData | null;
  onSelectNextLevel?: (nextLvl: string) => void;
  onRelearn?: () => void;
}

export default function CertificateModal({
  visible,
  onClose,
  certificate,
  onSelectNextLevel,
  onRelearn,
}: CertificateModalProps) {
  const { isDark, theme } = useAppTheme();

  if (!certificate) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: isDark ? '#18181b' : '#ffffff' }]}>
          {/* Header Close */}
          <View style={styles.topBar}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="ribbon" size={20} color="#f59e0b" />
              <Text style={[styles.topTitle, { color: theme.text }]}>Chứng chỉ vinh danh</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* CERTIFICATE DIPLOMA CARD */}
            <View style={[styles.diplomaCard, { backgroundColor: isDark ? '#09090b' : '#fffdfa' }]}>
              {/* Outer Golden Border */}
              <View style={styles.innerBorder}>
                {/* Corner Decorations */}
                <Ionicons name="sparkles" size={13} color="#d97706" style={[styles.cornerStar, { top: 6, left: 6 }]} />
                <Ionicons name="sparkles" size={13} color="#d97706" style={[styles.cornerStar, { top: 6, right: 6 }]} />
                <Ionicons name="sparkles" size={13} color="#d97706" style={[styles.cornerStar, { bottom: 6, left: 6 }]} />
                <Ionicons name="sparkles" size={13} color="#d97706" style={[styles.cornerStar, { bottom: 6, right: 6 }]} />

                {/* Academy Emblem */}
                <View style={styles.emblemContainer}>
                  <Image
                    source={require('../../assets/images/gacon.gif')}
                    style={styles.emblemImg}
                  />
                  <Text style={styles.academyName}>ENGMASTER ACADEMY</Text>
                  <Text style={styles.academySub}>VIỆN ĐÀO TẠO TIẾNG ANH CHUẨN QUỐC TẾ CEFR</Text>
                </View>

                {/* Certificate Title */}
                <View style={styles.titleDivider} />
                <Text style={styles.certificateMainTitle}>CHỨNG NHẬN TỐT NGHIỆP</Text>
                <Text style={styles.certificateEnglishTitle}>CERTIFICATE OF COMPLETION</Text>
                <View style={styles.titleDivider} />

                {/* Recipient */}
                <Text style={[styles.certifyText, { color: isDark ? '#a1a1aa' : '#6b7280' }]}>
                  Chứng nhận học viên xuất sắc:
                </Text>
                <Text style={styles.recipientName}>{certificate.recipientName}</Text>

                {/* Level Completed */}
                <Text style={[styles.reasonText, { color: isDark ? '#a1a1aa' : '#4b5563' }]}>
                  Đã hoàn thành 100% chương trình học tập, nắm vững từ vựng và vượt qua toàn bộ các bài đánh giá năng lực 5 kỹ năng theo khung tham chiếu Châu Âu:
                </Text>

                <View style={styles.levelBadgeContainer}>
                  <Text style={styles.levelBadgeText}>
                    CẤP ĐỘ {certificate.levelTitle ? certificate.levelTitle.toUpperCase() : certificate.level}
                  </Text>
                </View>

                {/* Stats Summary */}
                <View style={[styles.statsRow, { backgroundColor: isDark ? '#18181b' : '#f8fafc' }]}>
                  <View style={styles.statCol}>
                    <Text style={styles.statNum}>{certificate.totalLessons}</Text>
                    <Text style={styles.statLbl}>Bài học</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statCol}>
                    <Text style={styles.statNum}>{certificate.totalWords}</Text>
                    <Text style={styles.statLbl}>Từ vựng</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statCol}>
                    <Text style={styles.statNum}>{certificate.xpPoints || 100}%</Text>
                    <Text style={styles.statLbl}>Hoàn thành</Text>
                  </View>
                </View>

                {/* Signature & Seal Footer */}
                <View style={styles.certFooter}>
                  <View style={styles.certMeta}>
                    <Text style={[styles.metaLabel, { color: isDark ? '#a1a1aa' : '#6b7280' }]}>
                      Mã chứng chỉ:
                    </Text>
                    <Text style={[styles.metaVal, { color: theme.text }]}>
                      {certificate.certificateId}
                    </Text>
                    <Text style={[styles.metaLabel, { color: isDark ? '#a1a1aa' : '#6b7280', marginTop: 4 }]}>
                      Ngày cấp:
                    </Text>
                    <Text style={[styles.metaVal, { color: theme.text }]}>
                      {certificate.issuedDate}
                    </Text>
                  </View>

                  <View style={styles.goldSealBox}>
                    <View style={styles.goldSealCircle}>
                      <Ionicons name="ribbon" size={24} color="#b45309" />
                      <Text style={styles.goldSealText}>VERIFIED</Text>
                      <Text style={styles.goldSealSub}>CEFR</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* PHẦN CHỌN CẤP ĐỘ TIẾP THEO (DỄ, TRUNG BÌNH, KHÓ - GIỐNG NHƯ ONBOARDING) */}
            <View style={styles.nextLevelSection}>
              <View style={styles.nextLevelHeader}>
                <Ionicons name="sparkles" size={18} color="#f59e0b" />
                <Text style={[styles.nextLevelSectionTitle, { color: theme.text }]}>
                  Chọn mục tiêu học tập tiếp theo
                </Text>
              </View>
              <Text style={[styles.nextLevelSectionSub, { color: theme.subtext }]}>
                Chúc mừng bạn đã hoàn thành cấp độ này! Hãy chọn cấp độ tiếp theo để tiếp tục lộ trình học:
              </Text>

              {THREE_LEVEL_OPTIONS.map((group) => {
                const isCurrent = certificate.level === group.id || certificate.level?.includes(group.name);
                const isSuggested = certificate.nextLevel === group.id || (!isCurrent && certificate.level === 'A1-A2' && group.id === 'B1-B2') || (!isCurrent && certificate.level === 'B1-B2' && group.id === 'C1-C2');

                return (
                  <TouchableOpacity
                    key={group.id}
                    style={[
                      styles.choiceCard,
                      { backgroundColor: theme.card, borderColor: theme.border },
                      isSuggested && {
                        borderColor: '#10b981',
                        backgroundColor: isDark ? '#052e16' : '#ecfdf5',
                        borderWidth: 2,
                      },
                      isCurrent && {
                        borderColor: '#f59e0b',
                        backgroundColor: isDark ? '#451a03' : '#fffbeb',
                        borderWidth: 1.5,
                      }
                    ]}
                    onPress={() => {
                      onClose();
                      if (isCurrent && onRelearn) {
                        onRelearn();
                      } else if (onSelectNextLevel) {
                        onSelectNextLevel(group.id);
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.choiceCardTop}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text
                          style={[
                            styles.choiceCardTitle,
                            { color: theme.text },
                            isSuggested && { color: isDark ? '#34d399' : '#047857' },
                            isCurrent && { color: isDark ? '#fbbf24' : '#b45309' },
                          ]}
                        >
                          {group.title}
                        </Text>
                        {isSuggested && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                            <Ionicons name="sparkles" size={13} color="#f59e0b" />
                            <Text style={{ fontSize: 12, color: isDark ? '#34d399' : '#047857', fontWeight: 'bold' }}>
                              (Gợi ý tiếp theo)
                            </Text>
                          </View>
                        )}
                      </View>

                      {isCurrent ? (
                        <View style={[styles.choiceActionBadge, { backgroundColor: '#f59e0b' }]}>
                          <Ionicons name="refresh" size={12} color="#ffffff" />
                          <Text style={styles.choiceActionBadgeText}>Học lại</Text>
                        </View>
                      ) : isSuggested ? (
                        <View style={[styles.choiceActionBadge, { backgroundColor: '#10b981' }]}>
                          <Ionicons name="arrow-forward" size={12} color="#ffffff" />
                          <Text style={styles.choiceActionBadgeText}>Tiến lên</Text>
                        </View>
                      ) : (
                        <Ionicons name="chevron-forward" size={18} color={theme.subtext} />
                      )}
                    </View>

                    <Text style={[styles.choiceCardDesc, { color: theme.subtext }]}>
                      {isCurrent ? `${group.desc} • Đã tốt nghiệp 100% (Chạm để học lại)` : group.desc}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                style={[styles.closeBottomBtn, { backgroundColor: isDark ? '#27272a' : '#f1f5f9', marginTop: 10 }]}
                onPress={onClose}
              >
                <Text style={[styles.closeBottomText, { color: theme.text }]}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
  },
  container: {
    width: '100%',
    maxHeight: '92%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150,150,150,0.15)',
  },
  topTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 4,
  },
  scrollBody: {
    padding: 16,
    alignItems: 'center',
  },

  /* DIPLOMA STYLES */
  diplomaCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#d97706',
    padding: 8,
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  innerBorder: {
    borderWidth: 1.5,
    borderColor: '#fbbf24',
    borderRadius: 10,
    borderStyle: 'dashed',
    padding: 16,
    alignItems: 'center',
    position: 'relative',
  },
  cornerStar: {
    position: 'absolute',
    color: '#d97706',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emblemContainer: {
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 10,
  },
  emblemImg: {
    width: 48,
    height: 48,
    marginBottom: 4,
  },
  academyName: {
    fontSize: 14,
    fontWeight: '900',
    color: '#b45309',
    letterSpacing: 2,
  },
  academySub: {
    fontSize: 9,
    color: '#92400e',
    fontWeight: '600',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  titleDivider: {
    width: 60,
    height: 1.5,
    backgroundColor: '#f59e0b',
    marginVertical: 4,
  },
  certificateMainTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#b45309',
    textAlign: 'center',
    letterSpacing: 1,
    marginTop: 4,
  },
  certificateEnglishTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#d97706',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  certifyText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
  },
  recipientName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2563eb',
    textAlign: 'center',
    marginVertical: 6,
    textDecorationLine: 'underline',
  },
  reasonText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
    marginVertical: 6,
  },
  levelBadgeContainer: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginVertical: 8,
  },
  levelBadgeText: {
    color: '#92400e',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },

  statsRow: {
    flexDirection: 'row',
    width: '100%',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginVertical: 10,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statCol: {
    alignItems: 'center',
  },
  statNum: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  },
  statLbl: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(150,150,150,0.2)',
  },

  certFooter: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(217, 119, 6, 0.2)',
  },
  certMeta: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  metaVal: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  goldSealBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#f59e0b',
    padding: 2,
  },
  goldSealCircle: {
    flex: 1,
    borderRadius: 28,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#d97706',
  },
  goldSealText: {
    fontSize: 7,
    fontWeight: '900',
    color: '#b45309',
    letterSpacing: 0.5,
  },
  goldSealSub: {
    fontSize: 6,
    fontWeight: 'bold',
    color: '#d97706',
  },

  /* Next Level Selection */
  nextLevelSection: {
    width: '100%',
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150,150,150,0.15)',
  },
  nextLevelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  nextLevelSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  nextLevelSectionSub: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  choiceCard: {
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  choiceCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  choiceCardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  choiceActionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  choiceActionBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  choiceCardDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  closeBottomBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeBottomText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
