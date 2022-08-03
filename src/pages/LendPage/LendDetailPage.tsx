import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  withStyles,
  Table,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Snackbar,
} from '@material-ui/core';
import { Skeleton, Alert } from '@material-ui/lab';

import { _100 } from '@uniswap/sdk/dist/constants';
import { useHistory, useLocation } from 'react-router-dom';
import ToggleSwitch from 'components/ToggleSwitch';

import { QuickModalContent } from 'components/LendModals';

import { usePoolData } from 'hooks/marketxyz/usePoolData';
import { midUsdFormatter, shortUsdFormatter } from 'utils/bigUtils';
import { getDaysCurrentYear, shortenAddress, convertBNToNumber } from 'utils';
import { useExtraPoolData } from 'hooks/marketxyz/useExtraPoolData';
import { useActiveWeb3React } from 'hooks';
import { useMarket } from 'hooks/marketxyz/useMarket';
import { USDPricedPoolAsset } from 'utils/marketxyz/fetchPoolData';

import {
  toggleCollateral,
  convertMantissaToAPY,
  convertMantissaToAPR,
  getPoolAssetToken,
} from 'utils/marketxyz';
import { useBorrowLimit } from 'hooks/marketxyz/useBorrowLimit';
import { useTranslation } from 'react-i18next';
import { QuestionHelper, CopyHelper, CurrencyLogo } from 'components';
import 'pages/styles/lend.scss';
import { GlobalValue } from 'constants/index';
import LendDetailAssetStats from './LendDetailAssetStats';

const LendDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const location = useLocation();
  const { chainId, account } = useActiveWeb3React();
  const [supplyToggled, setSupplyToggled] = useState(false);
  const [assetsCollateral, setAssetsCollateral] = useState<
    { address: string; collateral: boolean }[]
  >([]);

  const [modalIsBorrow, setModalIsBorrow] = useState<boolean>(false);
  const [alertShow, setAlertShow] = useState({
    open: false,
    msg: '',
    status: 'success',
  });

  const [selectedAsset, setSelectedAsset] = useState<USDPricedPoolAsset>();

  const { sdk } = useMarket();
  const poolId = location && new URLSearchParams(location.search).get('poolId');
  const poolData = usePoolData(poolId, GlobalValue.marketSDK.QS_PoolDirectory);

  const extraPoolData = useExtraPoolData(
    poolData?.pool.comptroller,
    account ?? undefined,
  );

  const borrowLimit = useBorrowLimit(poolData?.assets);
  const handleAlertShowClose = () => {
    setAlertShow({
      open: false,
      msg: '',
      status: 'error',
    });
  };

  useEffect(() => {
    if (!poolData) {
      setAssetsCollateral([]);
    } else {
      const collaterals = poolData.assets.map((asset) => {
        return { address: asset.cToken.address, collateral: asset.membership };
      });
      setAssetsCollateral(collaterals);
    }
  }, [poolData]);

  const poolUtilization = !poolData
    ? 0
    : !poolData.totalSuppliedUSD
    ? 0
    : (poolData.totalBorrowedUSD / poolData.totalSuppliedUSD) * 100;

  const lendDataArr = [
    {
      label: t('totalSupply'),
      data: poolData ? midUsdFormatter(poolData.totalSuppliedUSD) : undefined,
    },
    {
      label: t('totalBorrowed'),
      data: poolData ? midUsdFormatter(poolData.totalBorrowedUSD) : undefined,
    },
    {
      label: t('liquidity'),
      data: poolData ? midUsdFormatter(poolData.totalLiquidityUSD) : undefined,
    },
    {
      label: t('poolUtilization'),
      data: poolData ? poolUtilization.toFixed(2) + '%' : undefined,
    },
  ];

  const poolDetails = [
    {
      label: t('totalSupplied'),
      data: poolData ? midUsdFormatter(poolData.totalSuppliedUSD) : undefined,
    },
    {
      label: t('totalBorrowed'),
      data: poolData ? midUsdFormatter(poolData.totalBorrowedUSD) : undefined,
    },
    {
      label: t('availableLiquidity'),
      data: poolData ? midUsdFormatter(poolData.totalLiquidityUSD) : undefined,
    },
    {
      label: t('poolUtilization'),
      data: poolData ? poolUtilization.toFixed(2) + '%' : undefined,
    },
    {
      label: t('upgradable'),
      data: extraPoolData
        ? extraPoolData.upgradeable
          ? 'Yes'
          : 'No'
        : undefined,
    },
    {
      label: t('admin'),
      data: extraPoolData ? (
        <Box className='flex items-center'>
          <small className='text-gray29'>
            {shortenAddress(extraPoolData.admin)}
          </small>
          <CopyHelper toCopy={extraPoolData.admin} />
        </Box>
      ) : (
        undefined
      ),
    },
    {
      label: t('platformFee'),
      data: poolData
        ? poolData.assets.length > 0
          ? (Number(poolData.assets[0].fuseFee.toString()) / 1e16).toFixed(2) +
            '%'
          : '10%'
        : undefined,
    },
    {
      label: t('averageAdminFee'),
      data: poolData
        ? poolData.assets.reduce(
            (a, b, _, { length }) =>
              a + Number(b.adminFee.toString()) / 1e16 / length,
            0,
          )
        : undefined,
    },
    {
      label: t('closeFactor'),
      data: extraPoolData ? extraPoolData.closeFactor / 1e16 + '%' : undefined,
    },
    {
      label: t('liquidationIncentive'),
      data: extraPoolData
        ? extraPoolData.liquidationIncentive / 1e16 - 100 + '%'
        : undefined,
    },
    {
      label: t('oracle'),
      data: extraPoolData ? shortenAddress(extraPoolData.oracle) : undefined,
    },
    {
      label: t('whitelist'),
      data: extraPoolData
        ? extraPoolData.enforceWhitelist
          ? 'Yes'
          : 'No'
        : undefined,
    },
  ];

  return (
    <>
      <Box width={'100%'}>
        <Box className='flex flex-wrap items-center' gridGap={'20px'}>
          <Box
            className='flex items-center cursor-pointer'
            onClick={() => {
              history.push('../lend');
            }}
          >
            <svg
              data-name='Layer 2'
              xmlns='http://www.w3.org/2000/svg'
              width='28'
              height='28'
              viewBox='0 0 28 28'
            >
              <g data-name='invisible box'>
                <path
                  data-name='Rectangle 20001'
                  fill='none'
                  d='M0 0h28v28H0z'
                />
              </g>
              <g data-name='Q3 icons'>
                <path
                  data-name='Path 11780'
                  d='m16.285 10.35-6.942 7a1.108 1.108 0 0 0 0 1.633l6.942 7a1.225 1.225 0 0 0 1.575.117 1.108 1.108 0 0 0 .117-1.75l-5.017-5.016h12.367a1.167 1.167 0 1 0 0-2.333H12.96l5.017-5.017a1.108 1.108 0 0 0-.117-1.75 1.225 1.225 0 0 0-1.575.117z'
                  transform='translate(-3.744 -4.167)'
                  fill='#448aff'
                />
              </g>
            </svg>
          </Box>
          <h4 className='text-bold'>{poolData?.pool.name}</h4>
          <Box display={'flex'} gridGap={'2px'}>
            {poolData?.assets.map((asset, i) => (
              <CurrencyLogo
                currency={getPoolAssetToken(asset, chainId)}
                key={i}
                size={'24px'}
              />
            ))}
          </Box>
        </Box>
        <Box my={'24px'}>
          <h5 className='text-gray29'>{t('lendPageTitle')}</h5>
        </Box>
        <Grid container spacing={3}>
          {lendDataArr.map((item) => (
            <Grid key={item.label} item xs={12} sm={6} md={3}>
              <Box className='lendPageData'>
                <small className='text-secondary'>{item.label}</small>
                {item.data ? (
                  <h4>{item.data}</h4>
                ) : (
                  <Skeleton variant='rect' height={40} />
                )}
              </Box>
            </Grid>
          ))}
        </Grid>
        <Box className='lendBorrowLimitWrapper' mt={'24px'}>
          <Box className='lendBorrowLimitText'>
            <Box>{t('borrowLimit')}</Box>
            <Box ml={'8px'}>
              <QuestionHelper text={t('borrowLimitHelper')} />
            </Box>
          </Box>
          <Box className='lendBorrowLimitLineWrapper'>
            <Box mr='20px'>
              <span>{midUsdFormatter(Math.min(50, borrowLimit))}</span>
            </Box>
            <Box className='lendBorrowLimitLine'>
              <Box className='lendBorrowLimitNormal' />
              <Box className='lendBorrowLimitWarning' />
              <Box className='lendBorrowLimitError' />
            </Box>
            <Box ml='20px'>
              {borrowLimit !== undefined ? (
                <span>{midUsdFormatter(borrowLimit)}</span>
              ) : (
                <Skeleton variant='rect' width={60} height={20} />
              )}
            </Box>
          </Box>
        </Box>
        <Box mt={3}>
          <Grid spacing={3} container>
            <Grid item xs={12} sm={12} md={6}>
              <Box className='poolDetailsItemWrapper'>
                <Box className='poolDetailsItemTop'>
                  <Box className='poolDetailsItemTag bg-primary' />
                  <h6>{t('supply')}</h6>
                  <Box display={'flex'}>
                    <small>{t('yoursupplybalance')}:&nbsp;</small>
                    {poolData ? (
                      <small className='text-gray29'>
                        {midUsdFormatter(poolData.totalSupplyBalanceUSD)}
                      </small>
                    ) : (
                      <Skeleton variant='rect' width={40} height={23} />
                    )}
                  </Box>
                </Box>
                <Box className='poolDetailsTableWrapper'>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <MuiTableCell>
                          {t('asset')} / {t('ltv')}
                        </MuiTableCell>
                        <MuiTableCell className='poolTableHideCell'>
                          {t('supplyapy')}
                        </MuiTableCell>
                        <MuiTableCell>{t('deposited')}</MuiTableCell>
                        <MuiTableCell>{t('collateral')}</MuiTableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {poolData?.assets.map((asset) => {
                        const assetCollateralIndex = assetsCollateral.findIndex(
                          ({ address }) =>
                            address.toLowerCase() ===
                            asset.cToken.address.toLowerCase(),
                        );
                        return (
                          <TableRow key={asset.cToken.address}>
                            <ItemTableCell
                              onClick={() => {
                                setSelectedAsset(asset);
                                setModalIsBorrow(false);
                              }}
                            >
                              <Box className='flex items-center'>
                                <Box display={'flex'} mr='8px'>
                                  <CurrencyLogo
                                    currency={getPoolAssetToken(asset, chainId)}
                                    size={'36px'}
                                  />
                                </Box>
                                <Box>
                                  <small className='text-gray29'>
                                    {asset.underlyingName}
                                  </small>
                                  <p className='caption'>
                                    {t('ltv')}:{' '}
                                    {sdk &&
                                      asset.collateralFactor
                                        .div(sdk.web3.utils.toBN(1e16))
                                        .toNumber()}
                                    %
                                  </p>
                                </Box>
                              </Box>
                            </ItemTableCell>
                            <ItemTableCell
                              className='poolTableHideCell'
                              onClick={() => {
                                setSelectedAsset(asset);
                                setModalIsBorrow(false);
                              }}
                            >
                              <small>
                                {convertMantissaToAPY(
                                  asset.supplyRatePerBlock,
                                  getDaysCurrentYear(),
                                ).toFixed(2)}
                                %
                              </small>
                              <Box className='flex items-center justify-end'>
                                <p className='caption'>
                                  {convertMantissaToAPY(
                                    asset.supplyRatePerBlock,
                                    getDaysCurrentYear(),
                                  ).toFixed(2)}
                                  %
                                </p>
                                <Box ml='2px' className='flex'>
                                  <CurrencyLogo
                                    currency={getPoolAssetToken(asset, chainId)}
                                    size={'16px'}
                                  />
                                </Box>
                              </Box>
                            </ItemTableCell>
                            <ItemTableCell
                              onClick={() => {
                                setSelectedAsset(asset);
                                setModalIsBorrow(false);
                              }}
                            >
                              <small className='text-gray29'>
                                {midUsdFormatter(asset.supplyBalanceUSD)}
                              </small>
                              <p className='caption text-secondary'>
                                {sdk
                                  ? convertBNToNumber(
                                      asset.supplyBalance,
                                      asset.underlyingDecimals,
                                    ).toFixed(2)
                                  : '?'}{' '}
                                {asset.underlyingSymbol}
                              </p>
                            </ItemTableCell>
                            <MuiTableCell>
                              <Box className='flex justify-end'>
                                <ToggleSwitch
                                  toggled={
                                    assetCollateralIndex >= 0
                                      ? assetsCollateral[assetCollateralIndex]
                                          .collateral
                                      : false
                                  }
                                  onToggle={() => {
                                    if (account && !supplyToggled) {
                                      setSupplyToggled(true);
                                      toggleCollateral(
                                        asset,
                                        poolData.pool.comptroller,
                                        account,
                                        asset.membership
                                          ? t('cannotExitMarket')
                                          : t('cannotEnterMarket'),
                                      )
                                        .then(() => {
                                          if (assetCollateralIndex >= 0) {
                                            setAssetsCollateral([
                                              ...assetsCollateral.slice(
                                                0,
                                                assetCollateralIndex,
                                              ),
                                              {
                                                address: asset.cToken.address,
                                                collateral: !assetsCollateral[
                                                  assetCollateralIndex
                                                ],
                                              },
                                              ...assetsCollateral.slice(
                                                assetCollateralIndex + 1,
                                              ),
                                            ]);
                                          }
                                        })
                                        .catch((er) => {
                                          setAlertShow({
                                            open: true,
                                            msg: er.message,
                                            status: 'error',
                                          });
                                        })
                                        .finally(() => setSupplyToggled(false));
                                    } else {
                                      setAlertShow({
                                        open: true,
                                        msg: t('walletnotconnected'),
                                        status: 'error',
                                      });
                                    }
                                  }}
                                />
                                <Snackbar
                                  open={alertShow.open}
                                  autoHideDuration={6000}
                                  anchorOrigin={{
                                    vertical: 'bottom',
                                    horizontal: 'left',
                                  }}
                                  onClose={handleAlertShowClose}
                                >
                                  <Alert
                                    onClose={handleAlertShowClose}
                                    severity={alertShow.status as any}
                                  >
                                    {alertShow.msg}
                                  </Alert>
                                </Snackbar>
                              </Box>
                            </MuiTableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={12} md={6}>
              <Box className='poolDetailsItemWrapper'>
                <Box className='poolDetailsItemTop'>
                  <Box className='poolDetailsItemTag bg-error' />
                  <h6>{t('borrow')}</h6>
                  <Box display={'flex'}>
                    <small>{t('yourborrowbalance')}:&nbsp;</small>
                    {poolData ? (
                      <small className='text-gray29'>
                        {midUsdFormatter(poolData.totalBorrowBalanceUSD)}
                      </small>
                    ) : (
                      <Skeleton variant='rect' width={40} height={23} />
                    )}
                  </Box>
                </Box>
                <Box className='poolDetailsTableWrapper'>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <MuiTableCell>{t('asset')}</MuiTableCell>
                        <MuiTableCell className='poolTableHideCell'>
                          {t('apr')} / {t('tvl')}
                        </MuiTableCell>
                        <MuiTableCell>{t('borrowed')}</MuiTableCell>
                        <MuiTableCell>{t('liquidity')}</MuiTableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {poolData?.assets.map((asset) => {
                        if (asset.isPaused) {
                          return null;
                        }
                        return (
                          <ItemTableRow
                            key={asset.cToken.address}
                            onClick={() => {
                              setSelectedAsset(asset);
                              setModalIsBorrow(true);
                            }}
                          >
                            <ItemTableCell>
                              <Box display={'flex'} alignItems={'center'}>
                                <Box display='flex' mr='8px'>
                                  <CurrencyLogo
                                    currency={getPoolAssetToken(asset, chainId)}
                                    size={'36px'}
                                  />
                                </Box>
                                <small className='text-gray29'>
                                  {asset.underlyingName}
                                </small>
                              </Box>
                            </ItemTableCell>
                            <ItemTableCell className='poolTableHideCell'>
                              <p className='caption'>
                                {convertMantissaToAPR(
                                  asset.borrowRatePerBlock,
                                ).toFixed(2)}
                                %
                              </p>
                              <p className='caption text-secondary'>
                                {shortUsdFormatter(asset.totalSupplyUSD)}{' '}
                                {t('tvl')}
                              </p>
                            </ItemTableCell>
                            <ItemTableCell>
                              <small className='text-gray29'>
                                {midUsdFormatter(asset.borrowBalanceUSD)}
                              </small>
                              <p className='caption text-secondary'>
                                {sdk
                                  ? convertBNToNumber(
                                      asset.borrowBalance,
                                      asset.underlyingDecimals,
                                    ).toFixed(2)
                                  : '?'}{' '}
                                {asset.underlyingSymbol}
                              </p>
                            </ItemTableCell>
                            <ItemTableCell>
                              <small className='text-gray29'>
                                {midUsdFormatter(asset.liquidityUSD)}
                              </small>
                              <p className='caption text-secondary'>
                                {sdk
                                  ? convertBNToNumber(
                                      asset.liquidity,
                                      asset.underlyingDecimals,
                                    ).toFixed(2)
                                  : '?'}{' '}
                                {asset.underlyingSymbol}
                              </p>
                            </ItemTableCell>
                          </ItemTableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={12} md={6}>
              <Box className='poolDetailsItemWrapper'>
                <Box className='poolDetailsItemTop'>
                  <h6>{t('poolInfo')}</h6>
                </Box>
                <Grid container>
                  {poolDetails.map((item, ind) => (
                    <Grid
                      item
                      xs={12}
                      sm={6}
                      key={ind}
                      className='poolDetailsInfoItem'
                    >
                      <small>{item.label}:</small>
                      {item.data ? (
                        <small className='text-gray29'>{item.data}</small>
                      ) : (
                        <Skeleton variant='rect' width={40} height={23} />
                      )}
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Grid>

            {poolData && <LendDetailAssetStats poolData={poolData} />}
          </Grid>
        </Box>
      </Box>

      {selectedAsset && (
        <QuickModalContent
          open={!!selectedAsset}
          onClose={() => setSelectedAsset(undefined)}
          borrow={modalIsBorrow}
          asset={selectedAsset}
          borrowLimit={borrowLimit ?? 0}
        />
      )}
    </>
  );
};

const MuiTableCell = withStyles({
  root: {
    padding: '0px',
    borderBottom: 'none',
  },
})(TableCell);

const ItemTableCell = withStyles({
  root: {
    cursor: 'pointer',
  },
})(MuiTableCell);

const ItemTableRow = withStyles({
  root: {
    cursor: 'pointer',
  },
})(TableRow);

export default LendDetailPage;