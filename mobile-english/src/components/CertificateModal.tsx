import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
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
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: isDark ? '#0f172a' : '#ffffff' }]}>
          {/* Header Bar */}
          <View style={[styles.topBar, { borderBottomColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.topIconBox}>
                <Ionicons name="ribbon" size={18} color="#d97706" />
              </View>
              <Text style={[styles.topTitle, { color: theme.text }]}>Chứng Chỉ Tốt Nghiệp CEFR</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
              <Ionicons name="close" size={18} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* LUXURY DIPLOMA CARD */}
            <View style={[styles.diplomaCard, { backgroundColor: isDark ? '#090d16' : '#fcfbf7', borderColor: isDark ? '#b45309' : '#d97706' }]}>
              
              {/* Outer Double Frame */}
              <View style={[styles.innerFrame, { borderColor: isDark ? '#78350f' : '#fde68a' }]}>
                
                {/* 4 Corner Geometric Ornaments */}
                <View style={[styles.cornerBox, styles.cornerTL]}>
                  <View style={[styles.cornerLineH, { backgroundColor: '#d97706' }]} />
                  <View style={[styles.cornerLineV, { backgroundColor: '#d97706' }]} />
                </View>
                <View style={[styles.cornerBox, styles.cornerTR]}>
                  <View style={[styles.cornerLineH, { backgroundColor: '#d97706' }]} />
                  <View style={[styles.cornerLineV, { backgroundColor: '#d97706' }]} />
                </View>
                <View style={[styles.cornerBox, styles.cornerBL]}>
                  <View style={[styles.cornerLineH, { backgroundColor: '#d97706' }]} />
                  <View style={[styles.cornerLineV, { backgroundColor: '#d97706' }]} />
                </View>
                <View style={[styles.cornerBox, styles.cornerBR]}>
                  <View style={[styles.cornerLineH, { backgroundColor: '#d97706' }]} />
                  <View style={[styles.cornerLineV, { backgroundColor: '#d97706' }]} />
                </View>

                {/* Institute Crest & Brand */}
                <View style={styles.crestContainer}>
                  <View style={[styles.crestCircle, { backgroundColor: isDark ? '#1e293b' : '#fef3c7', borderColor: '#d97706' }]}>
                    <Ionicons name="school" size={26} color="#d97706" />
                  </View>
                  <Text style={styles.institutionName}>ENGMASTER ACADEMY</Text>
                  <Text style={styles.institutionSub}>INTERNATIONAL CEFR LANGUAGE ASSESSMENT</Text>
                  <View style={styles.crestDivider}>
                    <View style={styles.crestDividerLine} />
                    <Ionicons name="star" size={10} color="#d97706" style={{ marginHorizontal: 6 }} />
                    <View style={styles.crestDividerLine} />
                  </View>
                </View>

                {/* Main Heading */}
                <Text style={[styles.certificateHeading, { color: isDark ? '#fbbf24' : '#92400e' }]}>
                  CHỨNG CHỈ VINH DANH
                </Text>
                <Text style={styles.certificateSubHeading}>
                  CERTIFICATE OF PROFICIENCY & ACHIEVEMENT
                </Text>

                {/* Presentation Wording */}
                <Text style={[styles.presentText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                  Trân trọng chứng nhận học viên:
                </Text>

                {/* Recipient Name */}
                <View style={styles.recipientContainer}>
                  <Text style={[styles.recipientName, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                    {certificate.recipientName}
                  </Text>
                  <View style={styles.recipientUnderline} />
                </View>

                {/* Performance Description */}
                <Text style={[styles.descriptionText, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                  Đã hoàn thành xuất sắc toàn bộ khóa học, nắm vững hệ thống từ vựng học thuật và vượt qua các bài kiểm tra đánh giá năng lực 5 kỹ năng đạt chuẩn quốc tế:
                </Text>

                {/* CEFR Level Honor Plaque */}
                <View style={[styles.levelPlaque, { backgroundColor: isDark ? '#1e293b' : '#1e3a8a' }]}>
                  <Ionicons name="medal" size={16} color="#fbbf24" style={{ marginRight: 6 }} />
                  <Text style={styles.levelPlaqueText}>
                    CHUẨN CEFR: {certificate.levelTitle ? certificate.levelTitle.toUpperCase() : certificate.level}
                  </Text>
                </View>

                {/* Academic Metrics Row */}
                <View style={[styles.metricsContainer, { backgroundColor: isDark ? '#131b2e' : '#f8fafc', borderColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
                  <View style={styles.metricItem}>
                    <Text style={[styles.metricValue, { color: isDark ? '#38bdf8' : '#0284c7' }]}>
                      {certificate.totalLessons}
                    </Text>
                    <Text style={styles.metricLabel}>BÀI HỌC</Text>
                  </View>
                  <View style={styles.metricSeparator} />
                  <View style={styles.metricItem}>
                    <Text style={[styles.metricValue, { color: isDark ? '#34d399' : '#059669' }]}>
                      {certificate.totalWords}
                    </Text>
                    <Text style={styles.metricLabel}>TỪ VỰNG</Text>
                  </View>
                  <View style={styles.metricSeparator} />
                  <View style={styles.metricItem}>
                    <Text style={[styles.metricValue, { color: isDark ? '#fbbf24' : '#d97706' }]}>
                      {certificate.xpPoints || 0}
                    </Text>
                    <Text style={styles.metricLabel}>ĐIỂM XP</Text>
                  </View>
                  <View style={styles.metricSeparator} />
                  <View style={styles.metricItem}>
                    <Text style={[styles.metricValue, { color: '#10b981' }]}>
                      100%
                    </Text>
                    <Text style={styles.metricLabel}>TIẾN ĐỘ</Text>
                  </View>
                </View>

                {/* Footer: Credential Metadata & Gold Seal */}
                <View style={styles.certFooter}>
                  {/* Metadata Left */}
                  <View style={styles.metaCol}>
                    <View style={styles.metaRow}>
                      <Text style={[styles.metaKey, { color: isDark ? '#64748b' : '#94a3b8' }]}>MÃ SỐ:</Text>
                      <Text style={[styles.metaVal, { color: theme.text }]}>{certificate.certificateId}</Text>
                    </View>
                    <View style={styles.metaRow}>
                      <Text style={[styles.metaKey, { color: isDark ? '#64748b' : '#94a3b8' }]}>NGÀY CẤP:</Text>
                      <Text style={[styles.metaVal, { color: theme.text }]}>{certificate.issuedDate}</Text>
                    </View>
                    <View style={styles.signatureLine}>
                      <View style={[styles.sigDash, { backgroundColor: isDark ? '#334155' : '#cbd5e1' }]} />
                      <Text style={[styles.sigTitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>Hội đồng Khảo thí EngMaster</Text>
                    </View>
                  </View>

                  {/* Gold Embossed Seal Right */}
                  <View style={styles.sealContainer}>
                    <View style={[styles.sealOuterRing, { borderColor: '#d97706' }]}>
                      <View style={[styles.sealMiddleRing, { borderColor: '#f59e0b' }]}>
                        <View style={[styles.sealInnerBadge, { backgroundColor: isDark ? '#451a03' : '#fef3c7' }]}>
                          <Ionicons name="shield-checkmark" size={20} color="#b45309" />
                          <Text style={styles.sealVerified}>VERIFIED</Text>
                          <Text style={styles.sealStandard}>CEFR STANDARD</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>

              </View>
            </View>

            {/* NEXT LEVEL GOAL SECTION */}
            <View style={styles.nextLevelSection}>
              <View style={styles.nextLevelHeader}>
                <Ionicons name="rocket-outline" size={20} color="#3b82f6" />
                <Text style={[styles.nextLevelSectionTitle, { color: theme.text }]}>
                  Lộ trình tiếp tục sau tốt nghiệp
                </Text>
              </View>
              <Text style={[styles.nextLevelSectionSub, { color: theme.subtext }]}>
                Hệ thống đề xuất bước tiến phù hợp để nâng cao năng lực phản xạ tiếng Anh của bạn:
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
                          <View style={styles.recBadge}>
                            <Ionicons name="sparkles" size={12} color="#047857" />
                            <Text style={styles.recBadgeText}>Đề xuất</Text>
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
                      {isCurrent ? `${group.desc} • Đã tốt nghiệp 100% (Nhấn để học lại & ôn tập)` : group.desc}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                style={[styles.closeBottomBtn, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', marginTop: 12 }]}
                onPress={onClose}
              >
                <Text style={[styles.closeBottomText, { color: theme.text }]}>Đóng cửa sổ</Text>
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
    backgroundColor: 'rgba(2, 6, 23, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  container: {
    width: '100%',
    maxHeight: '94%',
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  topIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    padding: 16,
    alignItems: 'center',
  },

  /* EXECUTIVE DIPLOMA STYLES */
  diplomaCard: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 2,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  innerFrame: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 16,
    alignItems: 'center',
    position: 'relative',
  },

  /* Corner Geometric Accents */
  cornerBox: {
    position: 'absolute',
    width: 14,
    height: 14,
  },
  cornerTL: { top: 4, left: 4 },
  cornerTR: { top: 4, right: 4, transform: [{ rotate: '90deg' }] },
  cornerBL: { bottom: 4, left: 4, transform: [{ rotate: '-90deg' }] },
  cornerBR: { bottom: 4, right: 4, transform: [{ rotate: '180deg' }] },
  cornerLineH: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 14,
    height: 2,
  },
  cornerLineV: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 2,
    height: 14,
  },

  /* Crest */
  crestContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  crestCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  institutionName: {
    fontSize: 13,
    fontWeight: '900',
    color: '#b45309',
    letterSpacing: 2.2,
  },
  institutionSub: {
    fontSize: 8,
    fontWeight: '700',
    color: '#92400e',
    letterSpacing: 1.1,
    marginTop: 2,
  },
  crestDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 140,
    marginTop: 6,
  },
  crestDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#d97706',
    opacity: 0.4,
  },

  /* Titles */
  certificateHeading: {
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  certificateSubHeading: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#b45309',
    letterSpacing: 1.2,
    marginTop: 2,
    marginBottom: 10,
  },
  presentText: {
    fontSize: 11,
    fontStyle: 'italic',
    letterSpacing: 0.2,
  },

  /* Recipient */
  recipientContainer: {
    alignItems: 'center',
    marginVertical: 6,
  },
  recipientName: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  recipientUnderline: {
    width: 100,
    height: 2,
    backgroundColor: '#d97706',
    marginTop: 4,
    borderRadius: 1,
  },

  /* Description */
  descriptionText: {
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    paddingHorizontal: 8,
    marginVertical: 8,
  },

  /* Level Honor Plaque */
  levelPlaque: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  levelPlaqueText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },

  /* Metrics Container */
  metricsContainer: {
    flexDirection: 'row',
    width: '100%',
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 10,
    marginVertical: 10,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontSize: 17,
    fontWeight: '800',
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  metricSeparator: {
    width: 1,
    height: 24,
    backgroundColor: '#cbd5e1',
    opacity: 0.4,
  },

  /* Footer & Seal */
  certFooter: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(217, 119, 6, 0.2)',
  },
  metaCol: {
    flex: 1,
    paddingRight: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  metaKey: {
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 0.6,
    width: 60,
  },
  metaVal: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  signatureLine: {
    marginTop: 8,
  },
  sigDash: {
    height: 1,
    width: 120,
    marginBottom: 4,
  },
  sigTitle: {
    fontSize: 8.5,
    fontStyle: 'italic',
  },

  /* Seal */
  sealContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealOuterRing: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  sealMiddleRing: {
    width: '100%',
    height: '100%',
    borderRadius: 31,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  sealInnerBadge: {
    width: '100%',
    height: '100%',
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealVerified: {
    fontSize: 7.5,
    fontWeight: '900',
    color: '#b45309',
    letterSpacing: 0.8,
    marginTop: 1,
  },
  sealStandard: {
    fontSize: 5.5,
    fontWeight: '700',
    color: '#92400e',
    letterSpacing: 0.3,
  },

  /* Next Level Section */
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
    gap: 8,
    marginBottom: 4,
  },
  nextLevelSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  nextLevelSectionSub: {
    fontSize: 12.5,
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
    fontWeight: '700',
  },
  recBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#d1fae5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  recBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  choiceActionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  choiceActionBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
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
