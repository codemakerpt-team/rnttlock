import React, {useEffect} from 'react';
import { View, FlatList, StyleSheet, Text, Button } from 'react-native';
import { Ttlock,  type ScanLockModal, BluetoothState, type LockVersion } from 'react-native-ttlock';
import { observer } from 'mobx-react';
import * as Toast from './toast-page';
import store from './store'

const initLock = (scanLockModal: ScanLockModal, navigation: any) => {
  Toast.showToastLoad("Init ...");

  // Get lock version information first
  Ttlock.getLockVersionWithLockMac(
    scanLockModal.lockMac,
    (lockVersion: LockVersion | string) => {
      // If the returned data is a string, parse it to an object first
      let versionData: any = lockVersion;
      if (typeof lockVersion === 'string') {
        try {
          versionData = JSON.parse(lockVersion);
        } catch (e) {
          // Parse failed, use original data
        }
      }
      
      // Check version information, if groupId == 11 and orgId == 22, add clientPara parameter
      // Native returns number type, use number for comparison directly
      const groupId = Number(versionData.groupId);
      const orgId = Number(versionData.orgId);
      const needClientPara = groupId === 11 && orgId === 22;
      
      // Build initLock parameter object
      let object: any = {
        lockMac: scanLockModal.lockMac,
        lockVersion: scanLockModal.lockVersion
      };
      
      // Add clientPara parameter if needed
      if (needClientPara) {
        object.clientPara = "JNF260106";
      }
      
      // Call initLock
      Ttlock.initLock(object, (lockData) => {
        Ttlock.stopScan();
        navigation.navigate("LockPage", {lockData: lockData, lockMac: scanLockModal.lockMac});
        Toast.hidden();
      }, (errorCode, errorDesc) => {
        Toast.showToast("errorCode："+ errorCode + " errorDesc:"+errorDesc);
      });
    },
    (errorCode, errorDesc) => {
      // If getting version information fails, show error message
      Toast.hidden();
      Toast.showToast("Failed to get version information, errorCode: " + errorCode + " errorDesc: " + errorDesc);
    }
  );
}

const renderItem = (item: ScanLockModal, navigation: any) => {
  let titleColor = item.isInited ? "lightgray" : "black";
  let title = item.isInited ? "" : "Init"
  return (
    <View style={styles.item}>
      <Text style={{ color: titleColor, fontSize: 20, lineHeight: 40 }} >{item.lockName}</Text>
      <Button title={title} color="blue" onPress={() => { initLock(item, navigation)}}>
      </Button>
    </View>
  );
}

const ScanLockPage = (props: { navigation: any; route: any; }) => {
  const { navigation } = props;

  useEffect(() => {
    Ttlock.getBluetoothState((state: BluetoothState)=>{
      console.log("BluetoothState：", state);
    });
    store.startScanLock();
   },[])

  return (
    <FlatList
      data={store.lockList}
      renderItem={({item})=>renderItem(item,navigation)}
      keyExtractor={item => item.lockMac}
    />
  );
}

const styles = StyleSheet.create({
  // container: {
  //   flex: 1,
  //   marginTop: StatusBar.currentHeight || 0,
  // },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderColor: '#ccc',
    borderWidth: 1,
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 5,
  },

});

export default observer(ScanLockPage)