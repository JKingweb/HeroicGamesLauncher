import { IpcRendererEvent } from "electron";
import React, { useEffect, useState } from "react";
import { NavLink, useParams } from 'react-router-dom';
import { getGameInfo, writeConfig } from "../../helper";
import { AppSettings, WineProps } from '../../types';
import Header from "../UI/Header";
import GeneralSettings from './GeneralSettings';
import OtherSettings from './OtherSettings';
import SyncSaves from './SyncSaves';
import Tools from './Tools';
import WineSettings from './WineSettings';

const {
  ipcRenderer,
} = window.require("electron");

interface RouteParams {
  appName: string;
  type: string;
}

// TODO: add option to add Custom wine
// TODO: add feedback when launching winecfg and winetricks
// TODO: Sync saves with installed EGS

export default function Settings() {
  const [wineVersion, setWineversion] = useState({
    name: "Wine Default",
    bin: "/usr/bin/wine",
  } as WineProps);
  const [winePrefix, setWinePrefix] = useState("~/.wine");
  const [defaultInstallPath, setDefaultInstallPath] = useState("");
  const [otherOptions, setOtherOptions] = useState("");
  const [egsLinkedPath, setEgsLinkedPath] = useState("")
  const [egsPath, setEgsPath] = useState(egsLinkedPath);
  const [savesPath, setSavesPath] = useState('');
  const [useGameMode, setUseGameMode] = useState(false);
  const [showFps, setShowFps] = useState(false);
  const [haveCloudSaving, setHaveCloudSaving] = useState(false);
  const [autoSyncSaves, setAutoSyncSaves] = useState(false)
  const [altWine, setAltWine] = useState([] as WineProps[]);

  const { appName, type } = useParams() as RouteParams;
  const isDefault = appName === 'default'
  const isGeneralSettings = type === 'general'
  const isWineSettings = type === 'wine'
  const isSyncSettings = type === 'sync'
  const isOtherSettings = type === 'other'

  const settings = isDefault ? 'defaultSettings' : appName

  useEffect(() => {
    ipcRenderer.send("requestSettings", appName);
    ipcRenderer.once(
      settings,
      async (event: IpcRendererEvent, config: AppSettings) => {
        setUseGameMode(config.useGameMode || false);
        setShowFps(config.showFps || false);
        setDefaultInstallPath(config.defaultInstallPath);
        setWineversion(config.wineVersion);
        setWinePrefix(config.winePrefix);
        setOtherOptions(config.otherOptions);
        setEgsLinkedPath(config.egsLinkedPath || "")
        setEgsPath(config.egsLinkedPath || "")
        setSavesPath(config.savesPath || "")
        setAutoSyncSaves(config.autoSyncSaves)
        if (!isDefault){
          const {cloudSaveEnabled} = await getGameInfo(appName)
          setHaveCloudSaving(cloudSaveEnabled)
        }
        
        ipcRenderer.send("getAlternativeWine");
        ipcRenderer.on(
          "alternativeWine",
          (event: IpcRendererEvent, args: WineProps[]) => setAltWine(args)
        );
      }
    );
  }, [appName, settings, type, isDefault]);

    const GlobalSettings = {
        defaultSettings: {
          defaultInstallPath,
          wineVersion,
          winePrefix,
          otherOptions,
          useGameMode,
          egsLinkedPath,
          showFps
        },
    }

    const GameSettings = {
      [appName]: {
        wineVersion,
        winePrefix,
        otherOptions,
        useGameMode,
        savesPath,
        showFps,
        autoSyncSaves
      },
    }

    const settingsToSave = isDefault ? GlobalSettings : GameSettings
    const returnPath = isDefault ? '/' : `/gameconfig/${appName}`

    useEffect(() => {
      writeConfig([appName, settingsToSave])
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [GlobalSettings, GameSettings, appName])
  
    return (
    <>
      <Header goTo={returnPath} renderBackButton />
      <div className="Settings">
        <div className='settingsNavbar'>
          {isDefault && 
          <NavLink to={{ pathname: '/settings/default/general' }}>
              General
          </NavLink>}
          <NavLink to={{ pathname: `/settings/${appName}/wine` }}>
            Wine
          </NavLink>
          {(!isDefault && haveCloudSaving) && 
          <NavLink to={{ pathname: `/settings/${appName}/sync`}}>
            Sync
          </NavLink>}
          <NavLink to={{ pathname: `/settings/${appName}/other`}}>
            Other
          </NavLink>
        </div>
        <div className="settingsWrapper">
          {isGeneralSettings &&
            <GeneralSettings 
              egsPath={egsPath} 
              setEgsPath={setEgsPath} 
              egsLinkedPath={egsLinkedPath}
              setEgsLinkedPath={setEgsLinkedPath}
              defaultInstallPath={defaultInstallPath} 
              setDefaultInstallPath={setDefaultInstallPath}
            />          
          }
          {isWineSettings && 
          <WineSettings 
            altWine={altWine}
            wineVersion={wineVersion}
            winePrefix={winePrefix}
            setWineversion={setWineversion}
            setWinePrefix={setWinePrefix}
          />}
          {isOtherSettings && 
          <OtherSettings 
            otherOptions={otherOptions} 
            setOtherOptions={setOtherOptions} 
            useGameMode={useGameMode}
            setUseGameMode={setUseGameMode}
            showFps={showFps}
            setShowFps={setShowFps}
          />}
          {isSyncSettings &&
            <SyncSaves 
              savesPath={savesPath}
              setSavesPath={setSavesPath}
              appName={appName}
              autoSyncSaves={autoSyncSaves}
              setAutoSyncSaves={setAutoSyncSaves}
            />
          }
          {isWineSettings && 
          <Tools 
            winePrefix={winePrefix}
            wineVersion={wineVersion}
          />}
          <span className="save">
              Settings are saved automatically
          </span>
        </div>
      </div>
    </>
  );
}
