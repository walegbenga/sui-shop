/**
 * Sui Shop Mobile App
 * Main entry point with wallet onboarding
 */
import 'react-native-get-random-values';
import { Buffer } from 'buffer';

global.Buffer = Buffer;

import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import walletService from './shared/WalletService';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// ==================== Splash Screen ====================

const SplashScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkWallet();
  }, []);

  const checkWallet = async () => {
    try {
      const hasWallet = await walletService.hasWallet();
      setTimeout(() => {
        if (hasWallet) {
          navigation.replace('UnlockWallet');
        } else {
          navigation.replace('WalletOnboarding');
        }
      }, 1500);
    } catch (error) {
      console.error('Splash error:', error);
      navigation.replace('WalletOnboarding');
    }
  };

  return (
    <View style={styles.splashContainer}>
      <Text style={styles.splashLogo}>🛍️</Text>
      <Text style={styles.splashTitle}>Sui Shop</Text>
      <Text style={styles.splashSubtitle}>Decentralized Social Commerce</Text>
      <ActivityIndicator size="large" color="#8b5cf6" style={{ marginTop: 40 }} />
    </View>
  );
};

// ==================== Wallet Onboarding ====================

const WalletOnboardingScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.onboardingContainer}>
        <Text style={styles.onboardingLogo}>🛍️</Text>
        <Text style={styles.onboardingTitle}>Welcome to Sui Shop</Text>
        <Text style={styles.onboardingSubtitle}>
          Buy and sell digital assets on Sui blockchain
        </Text>

        <View style={styles.featuresContainer}>
          <FeatureItem icon="⚡" title="Instant Transactions" description="Sub-second finality" />
          <FeatureItem icon="🛡️" title="Secure" description="Military-grade encryption" />
          <FeatureItem icon="💰" title="Low Fees" description="Only 2% platform fee" />
        </View>

        {/* Social Login Options (Easy for beginners) */}
        <View style={styles.socialLoginSection}>
          <Text style={styles.sectionTitle}>Easy Sign-Up (Recommended)</Text>
          
          <TouchableOpacity
            style={styles.googleButton}
            onPress={() => navigation.navigate('GoogleSignIn')}
          >
            <Text style={styles.socialIcon}>🔵</Text>
            <Text style={styles.socialButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.appleButton}
            onPress={() => navigation.navigate('AppleSignIn')}
          >
            <Text style={styles.socialIcon}>🍎</Text>
            <Text style={styles.socialButtonText}>Continue with Apple</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.emailButton}
            onPress={() => navigation.navigate('EmailSignIn')}
          >
            <Text style={styles.socialIcon}>📧</Text>
            <Text style={styles.socialButtonText}>Continue with Email</Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Traditional Wallet Options (For advanced users) */}
        <View style={styles.advancedSection}>
          <Text style={styles.sectionTitle}>Advanced Options</Text>
          
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('CreateWallet')}
          >
            <Text style={styles.secondaryButtonText}>Create Wallet (12-word phrase)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('ImportWallet')}
          >
            <Text style={styles.linkButtonText}>Import Existing Wallet</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.poweredBy}>Powered by CoA Tech</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const FeatureItem = ({ icon, title, description }: any) => (
  <View style={styles.featureItem}>
    <Text style={styles.featureIcon}>{icon}</Text>
    <View style={styles.featureText}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  </View>
);

// ==================== Create Wallet ====================

const CreateWalletScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(false);
  const [useBiometrics, setUseBiometrics] = useState(true);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);

  useEffect(() => {
    checkBiometrics();
  }, []);

  const checkBiometrics = async () => {
    const available = await walletService.isBiometricsAvailable();
    setBiometricsAvailable(available);
    setUseBiometrics(available);
  };

  const handleCreateWallet = async () => {
    try {
      setLoading(true);
      const { address, mnemonic } = await walletService.createWallet(useBiometrics);
      
      // Navigate to backup screen
      navigation.navigate('BackupWallet', { mnemonic, address });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.createWalletContainer}>
        <Text style={styles.screenTitle}>Create Wallet</Text>
        <Text style={styles.screenSubtitle}>
          Your wallet will be secured on your device
        </Text>

        <View style={styles.securityInfo}>
          <Text style={styles.infoIcon}>🔐</Text>
          <Text style={styles.infoTitle}>Your wallet, your keys</Text>
          <Text style={styles.infoDescription}>
            We never see or store your recovery phrase. You are in full control.
          </Text>
        </View>

        {biometricsAvailable && (
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setUseBiometrics(!useBiometrics)}
          >
            <View style={[styles.checkbox, useBiometrics && styles.checkboxChecked]}>
              {useBiometrics && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>
              Enable biometric authentication (Face ID / Fingerprint)
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
          onPress={handleCreateWallet}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Create Wallet</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.linkButtonText}>← Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

// ==================== Backup Wallet ====================

const BackupWalletScreen = ({ route, navigation }: any) => {
  const { mnemonic, address } = route.params;
  const [confirmed, setConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);

  const words = mnemonic.split(' ');

  const handleCopy = () => {
    // In real app, use Clipboard.setString(mnemonic)
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleContinue = async () => {
    if (!confirmed) {
      Alert.alert('Warning', 'Please confirm you have backed up your recovery phrase');
      return;
    }

    await walletService.markBackupComplete();
    navigation.replace('MainApp');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.backupContainer}>
        <Text style={styles.screenTitle}>Backup Recovery Phrase</Text>
        <Text style={styles.warningText}>
          ⚠️ Write down these 12 words in order and keep them safe
        </Text>

        <View style={styles.mnemonicContainer}>
          {words.map((word, index) => (
            <View key={index} style={styles.mnemonicWord}>
              <Text style={styles.mnemonicIndex}>{index + 1}</Text>
              <Text style={styles.mnemonicText}>{word}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
          <Text style={styles.copyButtonText}>
            {copied ? '✓ Copied!' : '📋 Copy to Clipboard'}
          </Text>
        </TouchableOpacity>

        <View style={styles.warningBox}>
          <Text style={styles.warningBoxTitle}>⚠️ Important</Text>
          <Text style={styles.warningBoxText}>
            • Never share your recovery phrase
            {'\n'}• Store it in a safe place
            {'\n'}• Sui Shop cannot recover lost phrases
            {'\n'}• Anyone with these words can access your funds
          </Text>
        </View>

        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setConfirmed(!confirmed)}
        >
          <View style={[styles.checkbox, confirmed && styles.checkboxChecked]}>
            {confirmed && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>
            I have securely backed up my recovery phrase
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryButton, !confirmed && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!confirmed}
        >
          <Text style={styles.primaryButtonText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

// ==================== Google Sign-In ====================

const GoogleSignInScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      
      // Import the social wallet service
      const { socialWalletService } = await import('./shared/SocialWalletService');
      
      const { address, email } = await socialWalletService.createWalletWithGoogle();
      
      Alert.alert(
        'Success!',
        `Wallet created!\n\nEmail: ${email}\nAddress: ${address.slice(0, 10)}...`,
        [{ text: 'OK', onPress: () => navigation.replace('MainApp') }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.socialSignInContainer}>
        <Text style={styles.screenTitle}>Sign in with Google</Text>
        <Text style={styles.screenSubtitle}>
          Your Google account will be linked to your Sui wallet
        </Text>

        <View style={styles.socialInfoBox}>
          <Text style={styles.infoIcon}>✨</Text>
          <Text style={styles.infoTitle}>What happens next?</Text>
          <Text style={styles.infoDescription}>
            • Sign in with your Google account{'\n'}
            • We'll create a Sui wallet for you{'\n'}
            • Your Google account becomes your backup{'\n'}
            • No seed phrases to remember!
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.googleButton, styles.largeButton, loading && styles.buttonDisabled]}
          onPress={handleGoogleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.socialIcon}>🔵</Text>
              <Text style={styles.socialButtonText}>Continue with Google</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.securityNote}>
          <Text style={styles.securityNoteText}>
            🔒 Your private keys are encrypted and stored securely on your device
          </Text>
        </View>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.linkButtonText}>← Back to other options</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

// ==================== Apple Sign-In ====================

const AppleSignInScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(false);

  const handleAppleSignIn = async () => {
    try {
      setLoading(true);
      
      const { socialWalletService } = await import('./shared/SocialWalletService');
      
      const { address, email } = await socialWalletService.createWalletWithApple();
      
      Alert.alert(
        'Success!',
        `Wallet created!\n\n${email ? `Email: ${email}\n` : ''}Address: ${address.slice(0, 10)}...`,
        [{ text: 'OK', onPress: () => navigation.replace('MainApp') }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.socialSignInContainer}>
        <Text style={styles.screenTitle}>Sign in with Apple</Text>
        <Text style={styles.screenSubtitle}>
          Your Apple ID will be linked to your Sui wallet
        </Text>

        <View style={styles.socialInfoBox}>
          <Text style={styles.infoIcon}>✨</Text>
          <Text style={styles.infoTitle}>What happens next?</Text>
          <Text style={styles.infoDescription}>
            • Sign in with your Apple ID{'\n'}
            • We'll create a Sui wallet for you{'\n'}
            • Your Apple ID becomes your backup{'\n'}
            • No seed phrases to remember!
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.appleButton, styles.largeButton, loading && styles.buttonDisabled]}
          onPress={handleAppleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.socialIcon}>🍎</Text>
              <Text style={styles.socialButtonText}>Continue with Apple</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.securityNote}>
          <Text style={styles.securityNoteText}>
            🔒 Your private keys are encrypted and stored securely on your device
          </Text>
        </View>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.linkButtonText}>← Back to other options</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

// ==================== Email Sign-In ====================

const EmailSignInScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleEmailSignIn = async () => {
    try {
      setLoading(true);
      
      const { socialWalletService } = await import('./shared/SocialWalletService');
      
      const result = await socialWalletService.createWalletWithEmail(email);
      
      if (result.success && result.requiresVerification) {
        setEmailSent(true);
        Alert.alert(
          'Check Your Email',
          'We sent you a magic link! Click it to complete wallet creation.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.socialSignInContainer}>
        <Text style={styles.screenTitle}>Sign in with Email</Text>
        <Text style={styles.screenSubtitle}>
          {emailSent 
            ? 'Check your inbox for the magic link'
            : 'We\'ll send you a magic link to create your wallet'}
        </Text>

        {!emailSent ? (
          <>
            <View style={styles.socialInfoBox}>
              <Text style={styles.infoIcon}>✨</Text>
              <Text style={styles.infoTitle}>How it works</Text>
              <Text style={styles.infoDescription}>
                • Enter your email address{'\n'}
                • We'll send you a secure link{'\n'}
                • Click the link to create your wallet{'\n'}
                • Your email becomes your recovery method
              </Text>
            </View>

            <TextInput
              style={styles.emailInput}
              placeholder="your.email@example.com"
              placeholderTextColor="#64748b"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity
              style={[styles.emailButton, styles.largeButton, loading && styles.buttonDisabled]}
              onPress={handleEmailSignIn}
              disabled={loading || !email}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.socialIcon}>📧</Text>
                  <Text style={styles.socialButtonText}>Send Magic Link</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.emailSentBox}>
            <Text style={styles.emailSentIcon}>📬</Text>
            <Text style={styles.emailSentTitle}>Email Sent!</Text>
            <Text style={styles.emailSentDescription}>
              Check your inbox at:{'\n'}
              <Text style={styles.emailAddress}>{email}</Text>
            </Text>
            <Text style={styles.emailSentNote}>
              The link expires in 15 minutes
            </Text>
            <TouchableOpacity
              style={styles.resendButton}
              onPress={handleEmailSignIn}
            >
              <Text style={styles.resendButtonText}>Resend Email</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.securityNote}>
          <Text style={styles.securityNoteText}>
            🔒 Your private keys are encrypted and stored securely on your device
          </Text>
        </View>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.linkButtonText}>← Back to other options</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

// ==================== Import Wallet ====================

const ImportWalletScreen = ({ navigation }: any) => {
  const [mnemonic, setMnemonic] = useState('');
  const [loading, setLoading] = useState(false);
  const [useBiometrics, setUseBiometrics] = useState(true);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);

  useEffect(() => {
    checkBiometrics();
  }, []);

  const checkBiometrics = async () => {
    const available = await walletService.isBiometricsAvailable();
    setBiometricsAvailable(available);
    setUseBiometrics(available);
  };

  const handleImport = async () => {
    const trimmedMnemonic = mnemonic.trim();
    
    if (!trimmedMnemonic) {
      Alert.alert('Error', 'Please enter your recovery phrase');
      return;
    }

    try {
      setLoading(true);
      await walletService.importWallet(trimmedMnemonic, useBiometrics);
      navigation.replace('MainApp');
    } catch (error: any) {
      Alert.alert('Import Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.importContainer}>
        <Text style={styles.screenTitle}>Import Wallet</Text>
        <Text style={styles.screenSubtitle}>
          Enter your 12 or 24-word recovery phrase
        </Text>

        <TextInput
          style={styles.mnemonicInput}
          placeholder="Enter recovery phrase (12 or 24 words)"
          placeholderTextColor="#64748b"
          multiline
          numberOfLines={4}
          value={mnemonic}
          onChangeText={setMnemonic}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {biometricsAvailable && (
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setUseBiometrics(!useBiometrics)}
          >
            <View style={[styles.checkbox, useBiometrics && styles.checkboxChecked]}>
              {useBiometrics && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>
              Enable biometric authentication
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
          onPress={handleImport}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Import Wallet</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.linkButtonText}>← Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

// ==================== Unlock Wallet ====================

const UnlockWalletScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Auto-unlock if biometrics enabled
    handleUnlock();
  }, []);

  const handleUnlock = async () => {
    try {
      setLoading(true);
      await walletService.unlockWallet();
      navigation.replace('MainApp');
    } catch (error: any) {
      Alert.alert('Unlock Failed', error.message);
      setLoading(false);
    }
  };

  return (
    <View style={styles.unlockContainer}>
      <Text style={styles.unlockLogo}>🛍️</Text>
      <Text style={styles.unlockTitle}>Sui Shop</Text>
      {loading ? (
        <>
          <ActivityIndicator size="large" color="#8b5cf6" style={{ marginTop: 40 }} />
          <Text style={styles.unlockSubtitle}>Unlocking wallet...</Text>
        </>
      ) : (
        <>
          <TouchableOpacity style={styles.primaryButton} onPress={handleUnlock}>
            <Text style={styles.primaryButtonText}>Unlock Wallet</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

// ==================== Main App (Placeholder) ====================

const HomeScreen = () => (
  <View style={styles.mainContainer}>
    <Text style={styles.mainTitle}>Marketplace</Text>
    <Text style={styles.mainSubtitle}>Browse and buy digital assets</Text>
  </View>
);

const WalletScreen = () => (
  <View style={styles.mainContainer}>
    <Text style={styles.mainTitle}>Wallet</Text>
    <Text style={styles.mainSubtitle}>Your SUI balance and transactions</Text>
  </View>
);

const ProfileScreen = () => (
  <View style={styles.mainContainer}>
    <Text style={styles.mainTitle}>Profile</Text>
    <Text style={styles.mainSubtitle}>Manage your account</Text>
  </View>
);

const MainAppTabs = () => (
  <Tab.Navigator
    screenOptions={{
      tabBarStyle: { backgroundColor: '#0f172a', borderTopColor: '#1e293b' },
      tabBarActiveTintColor: '#8b5cf6',
      tabBarInactiveTintColor: '#64748b',
      headerShown: false,
    }}
  >
    <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: () => <Text>🏠</Text> }} />
    <Tab.Screen name="Wallet" component={WalletScreen} options={{ tabBarIcon: () => <Text>💰</Text> }} />
    <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: () => <Text>👤</Text> }} />
  </Tab.Navigator>
);

// ==================== Main App Component ====================

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="WalletOnboarding" component={WalletOnboardingScreen} />
        
        {/* Social Login Options */}
        <Stack.Screen name="GoogleSignIn" component={GoogleSignInScreen} />
        <Stack.Screen name="AppleSignIn" component={AppleSignInScreen} />
        <Stack.Screen name="EmailSignIn" component={EmailSignInScreen} />
        
        {/* Traditional Wallet Options */}
        <Stack.Screen name="CreateWallet" component={CreateWalletScreen} />
        <Stack.Screen name="BackupWallet" component={BackupWalletScreen} />
        <Stack.Screen name="ImportWallet" component={ImportWalletScreen} />
        
        <Stack.Screen name="UnlockWallet" component={UnlockWalletScreen} />
        <Stack.Screen name="MainApp" component={MainAppTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// ==================== Styles ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#020617',
  },
  splashLogo: {
    fontSize: 80,
    marginBottom: 20,
  },
  splashTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  splashSubtitle: {
    fontSize: 16,
    color: '#94a3b8',
  },
  onboardingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  onboardingLogo: {
    fontSize: 60,
    marginTop: 40,
    marginBottom: 20,
  },
  onboardingTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  onboardingSubtitle: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 40,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  featureIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#94a3b8',
  },
  onboardingButtons: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  poweredBy: {
    marginTop: 40,
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  // Social Login Styles
  socialLoginSection: {
    width: '100%',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 12,
    textAlign: 'center',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
    gap: 10,
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  socialIcon: {
    fontSize: 20,
  },
  socialButtonText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    color: '#64748b',
    paddingHorizontal: 12,
    fontSize: 14,
  },
  advancedSection: {
    width: '100%',
  },
  socialSignInContainer: {
    padding: 24,
  },
  socialInfoBox: {
    alignItems: 'flex-start',
    padding: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    marginBottom: 24,
  },
  largeButton: {
    paddingVertical: 16,
  },
  securityNote: {
    marginTop: 24,
    padding: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  securityNoteText: {
    fontSize: 13,
    color: '#6ee7b7',
    textAlign: 'center',
    lineHeight: 18,
  },
  emailInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 20,
  },
  emailSentBox: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginBottom: 24,
  },
  emailSentIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emailSentTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 12,
  },
  emailSentDescription: {
    fontSize: 16,
    color: '#cbd5e1',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  emailAddress: {
    fontWeight: '600',
    color: '#10b981',
  },
  emailSentNote: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 20,
  },
  resendButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  resendButtonText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
  },
  createWalletContainer: {
    padding: 24,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 20,
    marginBottom: 10,
  },
  screenSubtitle: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 30,
  },
  securityInfo: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    marginBottom: 30,
  },
  infoIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  infoDescription: {
    fontSize: 14,
    color: '#cbd5e1',
    textAlign: 'center',
    lineHeight: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#64748b',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: '#cbd5e1',
  },
  linkButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  linkButtonText: {
    color: '#8b5cf6',
    fontSize: 16,
    fontWeight: '500',
  },
  backupContainer: {
    padding: 24,
  },
  warningText: {
    fontSize: 14,
    color: '#fbbf24',
    textAlign: 'center',
    marginBottom: 24,
  },
  mnemonicContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  mnemonicWord: {
    width: '30%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  mnemonicIndex: {
    fontSize: 12,
    color: '#64748b',
    marginRight: 8,
    fontWeight: '600',
  },
  mnemonicText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  copyButton: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    marginBottom: 24,
  },
  copyButtonText: {
    color: '#c4b5fd',
    fontSize: 14,
    fontWeight: '600',
  },
  warningBox: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    marginBottom: 24,
  },
  warningBoxTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fbbf24',
    marginBottom: 8,
  },
  warningBoxText: {
    fontSize: 14,
    color: '#fde68a',
    lineHeight: 20,
  },
  importContainer: {
    padding: 24,
  },
  mnemonicInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    color: '#ffffff',
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
  unlockContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#020617',
    padding: 24,
  },
  unlockLogo: {
    fontSize: 80,
    marginBottom: 20,
  },
  unlockTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  unlockSubtitle: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 20,
  },
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#020617',
    padding: 24,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  mainSubtitle: {
    fontSize: 16,
    color: '#94a3b8',
  },
});

export default App;
